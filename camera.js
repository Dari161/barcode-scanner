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
                    facingMode: 'environment'
                }
            }
        );
        videoStream = stream;
        // Create a video element to use as a source for the canvas
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
            // Set canvas dimensions based on video metadata
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        //console.log(canvas.width);
        //console.log(canvas.height);

        const track = stream.getVideoTracks()[0];

        // Apply torch mode if supported
        if (track && track.applyConstraints) {
            try {
                await track.applyConstraints({
                    advanced: [{ torch: true }]
                });
                console.log('Torch mode enabled.');
            } catch (err) {
                console.error('Failed to apply torch mode constraints:', err);
            }
        } else {
            console.warn('Torch mode not supported or could not be applied.');
        }

        // Function to draw video frames to the canvas
        const drawVideoToCanvas = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(drawVideoToCanvas);

            const y = canvas.height / 2;
            const grayscaleArray = new Array(Math.floor(canvas.width / 3)); // Pre-allocate the array
            let sum = 0;
            let i = 0;
            for (let x = Math.floor(canvas.width / 3); x < 2 * canvas.width / 3; ++x) {
                const imageData = ctx.getImageData(x, y, 1, 1);
                const pixel = imageData.data;
                const grayscale = (pixel[0] + pixel[1] + pixel[3]) / 3.0
                sum += grayscale;
                grayscaleArray[i] = grayscale;
                ++i;
            }
            const average = sum / (canvas.width / 3.0);
            let monoScaleArray = new Array(grayscaleArray.length);
            for (let i = 0; i < grayscaleArray.length; ++i) {
                if (grayscaleArray[i] > average) {
                    monoScaleArray[i] = 255;
                } else {
                    monoScaleArray[i] = 0;
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
