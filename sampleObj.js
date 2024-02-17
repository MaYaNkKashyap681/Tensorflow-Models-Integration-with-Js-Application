function formatData(data) {
    const formattedData = {
        box: {
            height: data.box.height,
            width: data.box.width,
            xMax: data.box.xMax,
            xMin: data.box.xMin,
            yMax: data.box.yMax,
            yMin: data.box.yMin
        },
        keypoints: data.keypoints.map(keypoint => ({
            x: keypoint.x,
            y: keypoint.y,
            name: keypoint.name
        }))
    };
    return formattedData;
}

// Example usage
export const input = {
    box: {
        height: 176.1500549316407 - 100,
        width: 176.15097045898438 - 100,
        xMax: 760.3682708740234 / 100,
        xMin: 584.2173004150391 / 100,
        yMax: 593.8507080078126 / 100,
        yMin: 417.70065307617193 / 100
    },
    keypoints: [
        { x: 640.3743743896484, y: 464.9230194091797, name: 'rightEye' },
        { x: 713.1723022460938, y: 465.6172180175781, name: 'leftEye' },
        { x: 682.4860382080078, y: 503.8890075683595, name: 'noseTip' },
        { x: 679.3956756591797, y: 540.5327606201173, name: 'mouthCenter' },
        { x: 586.2984466552734, y: 485.813446044922, name: 'rightEarTragion' },
        { x: 746.2098693847656, y: 485.7480621337891, name: 'leftEarTragion' }
    ]
};

const formattedData = formatData(input);
console.log(formattedData);
