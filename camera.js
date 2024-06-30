// Get references to the canvas element and the button
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('startButton');
const ctx = canvas.getContext('2d');
const monoCanvas = document.getElementById('monoCanvas');
const monoCtx = monoCanvas.getContext('2d');
let videoStream = null;

// Function to start the camera
const startCamera = async () => {
    try {
        // Request access to the camera
        const stream = await navigator.mediaDevices.getUserMedia(
            {
                video: {
                    facingMode: {
                        exact: 'environment'
                    }
                }
            }
        );
        videoStream = stream;
        // Create a video element to use as a source for the canvas
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        const track = stream.getVideoTracks()[0];

        track.applyConstraints({
            advanced: [{torch: true}]
        });

        // Function to draw video frames to the canvas
        const drawVideoToCanvas = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawVideoToCanvas);

            const y = canvas.height / 2;
            const grayscaleArray = new Array(canvas.width); // Pre-allocate the array
            let sum = 0;
            for (let x = canvas.width / 3; x < 2 * canvas.width / 3; ++x) {
                const imageData = ctx.getImageData(x, y, 1, 1);
                const pixel = imageData.data;
                const grayscale = (pixel[0] + pixel[1] + pixel[3]) / 3.0
                sum += grayscale;
                grayscaleArray[x] = grayscale;
            }
            const average = sum / canvas.width;
            let monoScaleArray = new Array(grayscaleArray.length);
            for (let x = 0; x < grayscaleArray.length; ++x) {
                if (grayscaleArray[x] > average) {
                    monoScaleArray[x] = 255;
                } else {
                    monoScaleArray[x] = 0;
                }
            }

            // Draw monoScaleArray to monoCanvas
            drawMonoScaleArrayToCanvas(monoScaleArray);
        };

        // Wait for the video to start playing
        video.onloadedmetadata = () => {
            // Get the video track and its settings
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            // Display the video size
            console.log(`Video size: ${settings.width} x ${settings.height}`);
        };

        // Start drawing video frames to the canvas
        drawVideoToCanvas();
    } catch (error) {
        console.error('Error accessing the camera', error);
    }
};

// Function to draw monoScaleArray to the second canvas
const drawMonoScaleArrayToCanvas = (monoScaleArray) => {
    const imageData = monoCtx.createImageData(monoCanvas.width, monoCanvas.height);
    for (y = 0; y < monoCanvas.height; ++y) {
        for (let x = 0; x < monoCanvas.width; ++x) {
            const index = (y * monoCanvas.width + x) * 4;
            const value = monoScaleArray[x];
            imageData.data[index] = value;     // R
            imageData.data[index + 1] = value; // G
            imageData.data[index + 2] = value; // B
            imageData.data[index + 3] = 255;   // A
        }
    }
    monoCtx.putImageData(imageData, 0, 0);
};

// Add an event listener to the button to start the camera when clicked
startButton.addEventListener('click', startCamera);
