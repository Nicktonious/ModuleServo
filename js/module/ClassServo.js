class ClassServo extends ClassMiddleActuator {
    /**
     * @constructor
     * @param {ActuatorPropsType} _actuatorProps 
     * @param {ActuatorOptsType} _opts
     */
    constructor(_actuatorProps, _opts) {
        ClassMiddleActuator.call(this, _actuatorProps, _opts);
        //TODO: add validation of props below
        this._Range = _actuatorProps.range;
        this._MaxPulse = _actuatorProps.maxPulse;
        this._MinPulse = _actuatorProps.minPulse;
    }
    On(_chNum, _val) {
        if (typeof _val !== 'number') throw new Error('Invalid arg');
        this._IsChOn[0] = true;

        let val = E.clip(_val, 0, 1);
        analogWrite(this._Pins[0], val, {freq:20, soft: false});
    }
    Off() {
        digitalWrite(this._Pins[0], 1);
        this._IsChOn[0] = false;
    }
    InitTasks() {
        this._Channels[0].AddTask('SetPos', (_deg) => {
            if (typeof _deg !== 'number') throw new Error('Invalid arg');
            let deg = E.clip(_deg, 0, this._Range);
            const proportion = (x, in_min, in_max, out_min, out_max) => {
                return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
            }
            let us = proportion(deg, this._MinPulse, this._MaxPulse, 0, this._Range);   //град -> мкс

            let val = proportion(us, this._MinPulse, this._MaxPulse, 0, 1);             //мкс -> число [0 : 1]

            this.On(0, val);
        });
    }
}