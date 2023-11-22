module.exports.getBlockTimeStamp = async (futureTime) => {
    const timestamp = Math.floor(futureTime / 1000);

    return timestamp;
}
