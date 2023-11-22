module.exports.getMilliseconds = async (delayInSeconds) => {
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + delayInSeconds * 1000);
    const timestamp = futureDate.getTime();

    return timestamp;
}
