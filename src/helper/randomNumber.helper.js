module.exports.getRandomNumber = (range) => {
    // Generate a random number between 0 and 1
    const randomFraction = Math.random();

    // Scale and shift the random number to the range 1 to 1000
    const randomNumber = Math.floor(randomFraction * range) + 1;

    return randomNumber;
}
