const { execSync } = require('child_process');
const { Round } = require('~/models/index');
const { createRound } = require('./createGame');
const { startRound } = require('./startGame');
const { endRound } = require('./endGame');

// Flags to check if a process is already running
let isProcessRunning = false;

// Function to handle the start process
const startProcess = async () => {
    if (!isProcessRunning) {
        isProcessRunning = true;
        try {
            const latestRound = await Round.findOne({
                order: [['createdAt', 'DESC']],
            });

            if (latestRound) {
                switch (latestRound.status) {
                    case 'CREATED':
                        console.log("Already created");
                        if (latestRound.startTime <= new Date()) {
                            await startRound(latestRound.id);
                        }
                        break;
                    case 'STARTED':
                        console.log("Already started");
                        if (latestRound.endTime <= new Date()) {
                            await endRound(latestRound.id);
                        }
                        break;
                    case 'ENDED':
                        console.log("Already ended");
                        await createRound();
                    default:
                        break;
                }
            } else {
                console.log('No rounds found.');
                await createRound();
            }
        } catch (error) {
            console.error('Error:', error);
        }
        isProcessRunning = false;
    } else {
        console.log('process is already running, skipping...');
    }
};

// Function to run processes continuously
const runProcessesContinuously = async () => {
    while (true) {
        startProcess();
        // Sleep for a specified interval before checking again
        // Adjust the sleep duration based on your needs
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
};

// Initial run at script start
runProcessesContinuously();