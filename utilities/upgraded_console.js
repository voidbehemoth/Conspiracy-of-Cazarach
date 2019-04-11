let exported_logger;
class Logger {
    constructor(mode){
        console.log(`logger module initiated: ${mode} mode`);
        if (mode === "dev") {
            this.allow_dev = true;
        } else {
            this.allow_dev = false;
        }
    }   
    dev(msg){
        if (this.allow_dev) {
            console.log(msg);
        }
    }
    log(msg){
        console.log(msg);
    }

}
function create_logger (mode) {
    exported_logger = new Logger(mode);
}
module.exports.init = create_logger;
module.exports.exported_logger = exported_logger;
console.log(`${__filename} loaded`);
