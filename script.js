// Global variables
let graphChart = null;

document.addEventListener('DOMContentLoaded', function() {
    const functionInput = document.getElementById('function-input');
    const visualizeButton = document.getElementById('visualize-button');
    const equationDisplay = document.getElementById('equation-display');

    visualizeButton.addEventListener('click', function() {
        const functionString = functionInput.value.trim();
        if (!functionString) {
            alert('Please enter a function.');
            return;
        }
        const visualizationType = document.querySelector('input[name="visualization-type"]:checked').value;
        visualizeButton.textContent = 'Processing...';
        visualizeButton.disabled = true;

        try {
            // Replace ^ with ** for JS compatibility
            let parsedFunction = functionString.replace(/\^/g, '**');
            const expr = math.parse(parsedFunction);
            const compiled = expr.compile();

            // Generate x values
            const x_values = [];
            const y_values = [];
            for (let x = -10; x <= 10; x += 0.02) {
                x_values.push(x);
            }

            let y_compute;
            let equation = '';
            if (visualizationType === 'derivative') {
                // Numeric derivative using math.js derivative
                const derivativeExpr = math.derivative(expr, 'x');
                const derivativeCompiled = derivativeExpr.compile();
                y_compute = (x) => {
                    try {
                        return derivativeCompiled.evaluate({x});
                    } catch {
                        return NaN;
                    }
                };
                equation = `f'(x) = ${derivativeExpr.toString()}`;
            } else if (visualizationType === 'integral') {
                // Numeric integral: approximate using cumulative numerical integration (trapezoidal rule)
                let integral = 0;
                let prevX = x_values[0];
                let prevY = compiled.evaluate({x: prevX});
                const integral_vals = [0];
                for (let i = 1; i < x_values.length; i++) {
                    const x = x_values[i];
                    const y = compiled.evaluate({x});
                    integral += (y + prevY) / 2 * (x - prevX);
                    integral_vals.push(integral);
                    prevX = x;
                    prevY = y;
                }
                y_compute = (_, i) => integral_vals[i];
                equation = `∫f(x)dx (approximate, C=0)`;
            } else {
                y_compute = (x) => {
                    try {
                        return compiled.evaluate({x});
                    } catch {
                        return NaN;
                    }
                };
                equation = `f(x) = ${expr.toString()}`;
            }

            // Evaluate y values and filter
            for (let i = 0; i < x_values.length; i++) {
                let y = y_compute(x_values[i], i);
                if (isFinite(y) && Math.abs(y) < 100) {
                    y_values.push(y);
                } else {
                    y_values.push(null); // For Chart.js to break line
                }
            }

            // Display equation and plot
            equationDisplay.textContent = equation;
            createGraph(x_values, y_values, visualizationType, functionString);
        } catch (err) {
            console.error(err);
            alert('Error processing function. Please check your input and try again.');
        } finally {
            visualizeButton.textContent = 'Visualize';
            visualizeButton.disabled = false;
        }
    });
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
    const dataPoints = xValues.map((x, i) => ({ x: x, y: yValues[i] }));
    graphChart.data.datasets[0].data = dataPoints;
    let label = '';
    switch(type) {
        case 'derivative': label = `Derivative of ${functionString}`; break;
        case 'integral': label = `Integral of ${functionString}`; break;
        default: label = functionString;
    }
    graphChart.data.datasets[0].label = label;
    graphChart.update();
}
