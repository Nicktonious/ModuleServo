//функция преобразует число, пропорционально приводя его к одного диапазона к другому
//пример: proportion(5, 0, 10, 10, 20) -> 15 
const proportion = (x, in_low, in_high, out_low, out_high) => {
    return (x - in_low) * (out_high - out_low) / (in_high - in_low) + out_low;
}

const FREQ = 50;    //частота ШИМа

/**
 * @class
 * Класс предназначен для обеспечения управления различными моделями сервоприводов с удержанием угла. Позволяет осуществлять инициализацию и управление сервоприводом в соответствии с его характеристиками: возможные углы поворота, мин. и макс. длины импульса, положение по-умолчанию.   
 */
class ClassServo extends ClassActuator {
    /**
     * @constructor
     * @param {ActuatorOptsType} _opts
     */
    constructor(_opts) {
        ClassActuator.call(this, _opts);
        /******************** Validation and init ********************** */
        if (typeof _opts.range !== 'number' || 
            typeof _opts.maxPulse !== 'number' ||
            typeof _opts.minPulse !== 'number') throw new Error('Some args are missing');
        if (_opts.range < 0 ||
            _opts.minPulse >= _opts.maxPulse ||
            _opts.startPos && typeof _opts.startPos !== 'number' ||
            _opts.startPos < 0 || 
            _opts.startPos > _opts.range) throw new Error('Invalid args');

        this._Range = _opts.range;
        this._MaxPulse = _opts.maxPulse;
        this._MinPulse = _opts.minPulse;
        this._StartPos = _opts.startPos || 0;
        this._Value = undefined;
        pinMode(this._Pins[0], 'output', true);
    }
    /**
     * @method
     * @description Устанавливает вал сервопривода в указанное положение.
     * @param {number} _chNum 
     * @param {number} _pos - положение относительно рабочего диапазона [0 <= pos <= 1]
     */
    SetValue(_chNum, _pos) {
        if (typeof _pos !== 'number') throw new Error('Invalid arg');

        let pos = E.clip(_pos, 0, 1);
        if (_pos !== pos) throw new Error('Invalid position value');
        
        const msec = proportion(pos, 0, 1, this._MinPulse, this._MaxPulse);   //процент -> длина импульса в мс
        const val = proportion(msec, 0, 20, 0, 1);  //мс -> число [0 : 1] (на практике приблизительно [0.027 : 0.12])
        
        this._Channels[0].Status = 1;
        analogWrite(this._Pins[0], val, { freq: FREQ, soft: true  });   //ШИМ
        this._Value = pos;               //значение позиции записывается в поле класса
    }

    /**
     * @method
     * @description Устанавливает вал сервопривода в стандартное положение
     */
    Reset() {
        this.SetValue(0, this._StartPos);
    }
    /**
     * @method
     * Метод возвращает объект, содержащий информацию о текущей позиции сервопривода
     * Примечание: метод возвращает данные, зависящие от последней команды, полученной сервоприводом; потому если он не был надлежащим образом откалиброван, либо его положение было изменено в обход методов, представленных в ModuleServo, полученные значения вероятно не будут соответствовать действительности
     * @returns 
     */
    GetInfo() {
        return ({
            currPos: this._Value, 
            currPosAngle: this._Value * this._Range
        });
    }
}
exports = ClassServo