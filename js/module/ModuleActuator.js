/**
 * @typedef ActuatorPropsType - объект хранящий описательные характеристики актуатора
 * @property {String} name
 * @property {String} type
 * @property {[String]} channelNames
 * @property {[String]} typeInSignals
 * @property {String} busType
 * @property {Object} manufacturingData
 * @property {Number} [address]
 */

/**
 * @class 
 * Базовый класс в стеке модуля. 
 * Собирает в себе основные данные об актуаторе: переданные шину, пины и тд. Так же сохраняет его описательную характеристику: имя, тип вх. и вых. сигналов, типы шин которые можно использовать, количество каналов и тд.
 */
class ClassAncestorActuator {
    /**
     * @typedef ActuatorOptsType
     * @property {any} bus - шина
     * @property {[Pin]} pins - массив пинов
     */
    /**
     * @constructor
     * @param {ActuatorPropsType} _actuatorProps - объект с описательными характеристиками актуатора, который передается в метод InitProps
     * @param {ActuatorOptsType} _opts - объект который содержит минимальный набор параметров, необходимых для инициализации и обеспечения работы актуатора
     */
    constructor(_actuatorProps, _opts) { 
        if (_opts.pins) _opts.pins.forEach(pin => {
            if (!(+Pin(pin))) throw new Error('Not a pin');
        });
        
        if (_opts.bus) this._Bus = _opts.bus;
        if (_opts.pins) this._Pins = _opts.pins;

        this.InitProps(_actuatorProps);
    }
    /**
     * @method
     * Метод инициализирует поля, хранящие описательные характеристики актуатора.
     * @param {ActuatorPropsType} _actuatorProps 
     */
    InitProps(_actuatorProps) { 
        const changeNotation = str => `_${str[0].toUpperCase()}${str.substr(1)}`;       //converts "propName" -> "_PropName"

        if (typeof _actuatorProps.quantityChannel !== 'number' || _actuatorProps.quantityChannel < 1) throw new Error('Invalid QuantityChannel arg ');
        this._QuantityChannel = _actuatorProps.quantityChannel;

        ['name', 'type', 'typeInSignals', 'channelNames', 'busTypes']
            .forEach(prop => {
                if (_actuatorProps[prop] instanceof Array) {
                    _actuatorProps[prop].forEach(elem => {
                        if (typeof elem !== 'string') throw new Error('Incorrect sensor property');
                    });
                }
                else if (typeof _actuatorProps[prop] !== 'string') throw new Error('Incorrect sensor property');
                this[changeNotation(prop)] = _actuatorProps[prop];
            });

        this._ManufacturingData = _actuatorProps.manufacturingData || {};
    }
}
/**
 * @class
 * Класс, который закладывает в будущие классы актуаторов поля и методы, необходимые для унификации работы с отдельными каналами, объекты которых становится возможным выделять из "реального" объекта актуатора.
 */
class ClassMiddleActuator extends ClassAncestorActuator {
    /**
     * @constructor
     * @param {ActuatorPropsType} _actuatorProps 
     * @param {ActuatorOptsType} _opts
     */
    constructor(_actuatorProps, _opts) {
        ClassAncestorActuator.apply(this, [_actuatorProps, _opts]);
        this._Channels = [];
        this._IsChOn = [];

        this.InitChannels();
    }
    /**
     * @getter
     * Возвращает количество инстанцированных объектов каналов актуатора.
     */
    get CountChannels() {
        return this._Channels.filter(o => o instanceof ClassChannelActuator).length;
    }
    /**
     * @method
     * Возвращает объект соответствующего канала если он уже был инстанцирован. Иначе возвращает null
     * @param {Number} _num - номер канала
     * @returns {ClassChannelActuator}
     */
    GetChannel(_num) {
        const num = _num;
        if (this._Channels[num] instanceof ClassChannelActuator) return this._Channels[num];
        return null;
    }
    /**
     * @method
     * Метод инициализирует объекты каналов актуатора.
     */
    InitChannels() {
        for (let i = 0; i < this._QuantityChannel; i++) {
            this._Channels[i] = new ClassChannelActuator(this, i);  // инициализируем и сохраняем объекты каналов 
            
            const initOn = (i => {     //применяется IIFE для замыкания значения i (необходимо для версий Espruino, в которых поведение let отличается от стандарта)
                const on = this.On.bind(this);
                //создание декоратора над On() для трансформации
                this.On = (_chNum, _val) => {
                    console.log(`on: ${_chNum}, ${_val}`);
                    let val = this._Channels[i]._DataRefine.TransformValue(_val);
                    val = this._Channels[i]._DataRefine.SuppressValue(val);
                    this._Channels[i]._Alarms.CheckZone(val);  
                    return on(_chNum, val);
                };
            })(i);
        }
        this._IsChOn[i] = false;
    }
    /**
     * @method
     * Обязывает провести инициализацию актуатора настройкой необходимых для его работы регистров 
     * @param {Object} [_opts] 
     */
    Init(_opts) { }
    /**
     * @method
     * Обязывает начать работу определенного канала актуатора. 
     * @param {Number} _chNum - номер канала 
     * @param {Number} _freq - частота, главный параметр, значение которого далее автоматически проходит через сервисные функции мат.обработки. 
     * @returns {Boolean} 
     */
    On(_chNum, _freq) { }
    /**
     * @method
     * Обязывает прекратить работу заданного канала. 
     * @param {Number} _chNum - номер канала, работу которого необходимо прекратить
     */
    Off(_chNum) { }
    /**
     * @method
     * Обязывает выполнить дополнительную конфигурацию актуатора - настройки, которые в общем случае необходимы для работы актуатора, но могут переопределяться в процессе работы, и потому вынесены из метода Init() 
     * @param {Object} [_opts] - объект с конфигурационными параметрами
     */
    ConfigureRegs(_opts) { }
    /**
     * @method
     * Обязывает выполнить перезагрузку актуатора
     */
    Reset() { }
    /**
     * @method
     * Обеспечивает чтение с регистра
     * @param {Number} _reg 
     */
    Read(_reg) { }
    /**
     * @method
     * Обеспечивает запись в регистр
     * @param {Number} _reg 
     * @param {Number} _val 
     */
    Write(_reg, _val) { }
}
/**
 * @class
 * Класс, представляющий каждый отдельно взятый канал актуатора. При чем, каждый канал является "синглтоном" для своего родителя.  
 */
class ClassChannelActuator {
    /**
     * @constructor
     * @param {ClassMiddleActuator} actuator - ссылка на основной объект актуатора
     * @param {Number} num - номер канала
     */
    constructor(actuator, num) {
        if (actuator._Channels[num] instanceof ClassChannelActuator) return actuator._Channels[num];    //если объект данного канала однажды уже был иницииализирован, то вернется ссылка, хранящаяся в объекте физического сенсора  

        this._Tasks = {};
        this._ActiveTask = null;

        this._ThisActuator = actuator;      //ссылка на объект физического актуатора
        this._NumChannel = num;             //номер канала (начиная с 0)
        this._DataRefine = new ClassDataRefine();
        this._Alarms = new ClassAlarms();
        actuator._Channels[num] = this;
    }
    /**
     * @getter
     * Возвращает уникальный идентификатор канала
     * @returns {String}
     */
    get ID() { return this._ThisActuator._Name + this._NumChannel; }
    /**
     * @getter
     * Возвращает работает ли канал
     * @returns {Boolean} 
     */
    get IsOn() { return this._ThisActuator._IsChOn[this._NumChannel]; }
    /**
     * @method
     * Возвращает активный в данный момент таск либо null
     * @returns {ClassTask}
     */
    get ActiveTask() { 
        for (let key in this._Tasks) {
            if (this._Tasks[key]._IsActive) return this._Tasks[key];
        }
        return null; 
    }
    /**
     * @method
     * Устанавливает базовые таски актутора
     */
    InitTasks() { }
    /**
     * @method
     * Метод обязывает запустить работу актуатора
     * @param {Number} _freq
     * @returns {Boolean} 
     */
    On(_freq) {
        return this._ThisActuator.On(this._NumChannel, _freq);
    }
    /**
     * @method
     * Метод прекращает работу канала актуатора.
     */
    Off() { 
        return this._ThisActuator.Off(this._NumChannel); 
    }
    /**
     * @method
     * Выполняет перезагрузку актуатора
     */
    Reset() { return this._ThisActuator.Reset.apply(this._ThisActuator.Reset, Array.from(arguments)); }
    /**
     * @method
     * Метод обязывающий выполнить конфигурацию актуатора либо значениями по умолчанию, либо согласно параметру _opts 
     * @param {Object} _opts - объект с конфигурационными параметрами
     */
    ConfigureRegs(_opts) {
        return this._ThisActuator.ConfigureRegs.apply(this._ThisActuator, Array.from(arguments));
    }
    /**
     * @method
     * Добавляет новый таск и создает геттер на него 
     * @param {string} _name - имя таска
     * @param {Function} func - функция-таск
     */
    AddTask(_name, _func) {
        if (typeof _name !== 'string' || typeof _func !== 'function') throw new Error('Invalid arg');
        
        this._Tasks[_name] = new ClassTask(this, _func);
    }
    /**
     * @method
     * Удаляет таск из коллекции по его имени
     * @param {String} _name 
     * @returns {Boolean} 
     */
    RemoveTask(_name) {
        return delete this._Tasks[_name]; 
    }
    /**
     * @method
     * Запускает таск по его имени с передачей аргументов.
     * @param {String} _name - идентификатор таска
     * @param {...any} _args - аргументы, которые передаются в таск.
     * Примечание! аргументы передаются в метод напрямую (НЕ как массив)  
     * @returns {Boolean}
     */
    RunTask(_name, _args) {
        if (!this._Tasks[_name]) return false;
        let args = [].slice.call(arguments, 1);
        return this._Tasks[_name].Invoke(args);
    }
    /**
     * @method
     * Устанавливает текущий активный таск как выполненный.
     * @param {Number} _code 
     */
    ResolveTask(_code) {
        this.ActiveTask.Resolve(_code || 0);
    }
    /**
     * @method
     * Прерывает выполнение текущего таска. 
     * Примечание: не рекомендуется к использованию, так как может вызвать ошибки
     * @returns {Boolean}
     */
    CancelTask() {
        if (!this.ActiveTask) return false;

        this.ActiveTask.Resolve();
        this.Off();
        return true;
    }
}
/**
 * @class
 * Класс реализующий функционал для обработки числовых значений по задаваемым ограничителям (лимитам) и заданной линейной функции 
 * */
class ClassDataRefine {
    constructor() {
        this._Values = [];  //[ 0 : limLow, 1: limHigh 2: _k, 3: _b ]
        this.SetLim(-Infinity, Infinity);
        this.SetTransformFunc(1, 0);
    }
    /**
     * @method
     * Метод устанавливает границы супрессорной функции
     * @param {Number} _limLow 
     * @param {Number} _limHigh 
     */
    SetLim(_limLow, _limHigh) {
        if (typeof _limLow !== 'number' || typeof _limHigh !== 'number') throw new Error('Not a number');

        if (_limLow >= _limHigh) throw new Error('limLow value shoud be less than limHigh');
        this._Values[0] = _limLow;
        this._Values[1] = _limHigh;
        return true;
    }
    /**
     * @method
     * Метод возвращает значение, прошедшее через супрессорную функцию
     * @param {Number} val 
     * @returns {Number}
     */
    SuppressValue(val) {
        return E.clip(val, this._Values[0], this._Values[1]);
    }
    /**
     * @method
     * Устанавливает коэффициенты k и b трансформирующей линейной функции 
     * @param {Number} _k 
     * @param {Number} _b 
     */
    SetTransformFunc(_k, _b) {
        if (typeof _k !== 'number' || typeof _b !== 'number') throw new Error('Not a number');
        this._Values[2] = _k;
        this._Values[3] = _b;
        return true;
    } 
    /**
     * @method
     * Возвращает значение, преобразованное линейной функцией
     * @param {Number} val 
     * @returns 
     */
    TransformValue(val) {
        return val * this._Values[2] + this._Values[3];
    }
}
const indexes = { redLow: 0, yelLow: 1, green: 2, yelHigh: 3, redHigh: 4 };
/**
 * @class
 * Реализует функционал для работы с зонами и алармами 
 * Хранит в себе заданные границы алармов и соответствующие им колбэки.
 * Границы желтой и красной зон определяются вручную, а диапазон зеленой зоны фактически подстраивается под желтую (или красную если желтая не определена).
 * 
 */
class ClassAlarms {
    constructor() {
        this._Zones = [];
        this._Callbacks = [];
        this._CurrZone = 'green';
    }
    /**
     * @method
     * Метод, который задает зоны измерения и их функции-обработчики
     * @param {Object} opts 
     */
    SetZones(opts) {
        const checkParams = {   // объект в котором каждой задаваемой зоне соответсвует функция, которая возвращает true если параметры, зад зоны валидны
            green: () => (typeof opts.green.cb === 'function'),
            yellow: () => (opts.yellow.low < opts.yellow.high),
            red: () => (opts.red.low < opts.red.high)
        };
        ['red', 'yellow', 'green'].filter(zoneName => opts[zoneName]).forEach(zoneName => {
            if (!checkParams[zoneName]) throw new Error('Incorrect args');
        });

        if (opts.yellow) {
            if (opts.red) {
                if (opts.yellow.low <= opts.red.low || opts.yellow.high >= opts.red.high) throw new Error('Invalid args');
            }
            else if (opts.yellow.low < this._Zones[indexes.redLow] || opts.yellow.high > this._Zones[indexes.redHigh]) throw new Error('Invalid args');
            this._Zones[indexes.yelLow] = opts.yellow.low;
            this._Zones[indexes.yelHigh] = opts.yellow.high;
            this._Callbacks[indexes.yelLow] = opts.yellow.cbLow;
            this._Callbacks[indexes.yelHigh] = opts.yellow.cbHigh;
        }
        if (opts.red) {
            if (opts.yellow) {
                if (opts.red.low >= opts.yellow.low || opts.red.high <= opts.yellow.high) throw new Error('Invalid args');
            }
            else if (opts.red.low > this._Zones[indexes.yelLow] || opts.red.high < this._Zones[indexes.yelHigh]) throw new Error('Invalid args');
            this._Zones[indexes.redLow] = opts.red.low;
            this._Zones[indexes.redHigh] = opts.red.high;
            this._Callbacks[indexes.redLow] = opts.red.cbLow;
            this._Callbacks[indexes.redHigh] = opts.red.cbHigh;
        }
        if (opts.green) {
            this._Callbacks[indexes.green] = opts.green.cb;
        }
    }
    /**
     * @method
     * Метод обновляет значение текущей зоны измерения по переданному значению и, если зона сменилась, вызывает её колбэк
     * @param {Number} val 
     */
    CheckZone(val) {
        let prevZone = this._CurrZone;
        this._CurrZone = val < this._Zones[indexes.redLow]  ? 'redLow'
                       : val > this._Zones[indexes.redHigh] ? 'redHigh'
                       : val < this._Zones[indexes.yelLow]  ? 'yelLow'
                       : val > this._Zones[indexes.yelHigh] ? 'yelHigh'
                       : 'green';

        if (prevZone !== this._CurrZone) {
            this._Callbacks[indexes[this._CurrZone]](prevZone);
        }
    }
}
/**
 * @class
 * Представляет собой таск актуатора - обертку над прикладной функцией
 */
class ClassTask {
    /**
     * @constructor
     * @param {ClassChannelActuator} _channel - объект канала актуатора
     * @param {Function} _func - функция, реализующая прикладную
     */
    constructor(_channel, _func) {                          //сохранение объекта таска в поле _Tasks по имени
        this.name = 'ClassTask';
        this._Channel = _channel;
        this._IsActive = false;

        this._Func = _func.bind(this._Channel);
    }
    /**
     * @method
     * Запускает выполнение таска
     */
    Invoke(args) {
        console.log(this._Channel instanceof ClassChannelActuator);
        let promisified = new Promise((res, rej) => {       //над переданной функцией инициализируется промис-обертка, колбэки resolve()/reject() которого должны быть вызваны при завершении выполнения таска

            this.resolve = res;
            this.reject = rej;
            
            if (this._Channel.ActiveTask) return this.Reject(-1);      //если уже запущен хотя бы один таск, вызов очередного отклоняется с кодом -1
            
            this._IsActive = true;

            return this._Func.apply(this._Channel, args);                   //вызов функции, выполняемой в контексте объекта-канала
        });
        return promisified;
    }
    /**
     * @method
     * Закрывает промис-обертку вызовом его колбэка resolve() с передачей числового кода (по умолчанию 0)
     * @param {Number} _code - код завершения
     */
    Resolve(_code) {
        this._IsActive = false;
        return this.resolve(_code || 0);
    }
    /**
     * @method
     * Закрывает промис-обертку вызовом его колбэка reject() с передачей числового кода (по умолчанию 0)
     * @param {Number} _code - код завершения
     */
    Reject(_code) {
        this._IsActive = false;
        return this.reject(_code || -1);
    }
}

exports = ClassMiddleActuator;