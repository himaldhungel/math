// Global variables
let graphChart = null;

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get references to DOM elements
    const functionInput = document.getElementById('function-input');
    const visualizeButton = document.getElementById('visualize-button');
    const graphCanvas = document.getElementById('graph-canvas');
    const equationDisplay = document.getElementById('equation-display');
    
    // Add event listener to the visualize button
    visualizeButton.addEventListener('click', function() {
        // Get the function from the input field
        const functionString = functionInput.value.trim();
        
        // Validate input
        if (!functionString) {
            alert('Please enter a function.');
            return;
        }
        
        // Get the selected visualization type
        const visualizationType = document.querySelector('input[name="visualization-type"]:checked').value;
        
        // Show loading state
        visualizeButton.textContent = 'Processing...';
        visualizeButton.disabled = true;
        
        // Send the request to the backend
        fetch('/visualize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                function: functionString,
                type: visualizationType
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Display the equation
            equationDisplay.textContent = data.equation;
            
            // Create or update the graph
            createGraph(data.x_values, data.y_values, visualizationType, functionString);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error processing function. Please check your input and try again.');
        })
        .finally(() => {
            // Reset button state
            visualizeButton.textContent = 'Visualize';
            visualizeButton.disabled = false;
        });
    });
    
    // Initialize an empty chart
    initializeChart();
});

function initializeChart() {
    const ctx = document.getElementById('graph-canvas').getContext('2d');
    graphChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Function',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'center',
                    title: {
                        display: true,
                        text: 'x'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    type: 'linear',
                    position: 'center',
                    title: {
                        display: true,
                        text: 'y'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function createGraph(xValues, yValues, type, functionString) {
    // Create data points from x and y values
    const dataPoints = xValues.map((x, i) => ({
        x: x,
        y: yValues[i]
    }));
    
    // Determine the label based on the visualization type
    let label;
    switch(type) {
        case 'derivative':
            label = `Derivative of ${functionString}`;
            break;
        case 'integral':
            label = `Integral of ${functionString}`;
            break;
        default:
            label = `f(x) = ${functionString}`;
    }
    
    // Update the chart
    graphChart.data.datasets[0].data = dataPoints;
    graphChart.data.datasets[0].label = label;
    graphChart.update();
}
