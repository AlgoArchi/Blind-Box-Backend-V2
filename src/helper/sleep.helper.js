module.exports.sleep = async (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
}
