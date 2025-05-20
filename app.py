from flask import Flask, request, jsonify, render_template
import sympy as sp
import numpy as np

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def home():
    return app.send_static_file('index.html')

@app.route('/visualize', methods=['POST'])
def visualize():
    try:
        # Get data from request
        data = request.json
        function_string = data['function']
        visualization_type = data['type']
        
        # Create a symbolic variable
        x = sp.Symbol('x')
        
        # Parse the function string to a symbolic expression
        # Replace ^ with ** for exponentiation (common user input vs. Python syntax)
        function_string = function_string.replace('^', '**')
        
        try:
            function_expr = sp.sympify(function_string)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
        
        # Process according to visualization type
        if visualization_type == 'derivative':
            result_expr = sp.diff(function_expr, x)
            equation = f"f'(x) = {sp.latex(result_expr)}"
        elif visualization_type == 'integral':
            result_expr = sp.integrate(function_expr, x)
            equation = f"∫f(x)dx = {sp.latex(result_expr)} + C"
        else:  # 'function'
            result_expr = function_expr
            equation = f"f(x) = {sp.latex(function_expr)}"
        
        # Convert symbolic expression to a callable function
        result_func = sp.lambdify(x, result_expr, "numpy")
        
        # Generate x values
        # Adjust the range and number of points as needed
        x_values = np.linspace(-10, 10, 1000)
        
        # Calculate y values, handling potential errors
        try:
            y_values = result_func(x_values)
            
            # Handle cases where some y values might be too large or NaN
            valid_indices = np.isfinite(y_values)
            x_values = x_values[valid_indices].tolist()
            y_values = y_values[valid_indices].tolist()
            
            # Limit to reasonable range for visualization
            # This is a basic approach; more sophisticated filtering could be used
            filter_indices = []
            for i in range(len(y_values)):
                if abs(y_values[i]) <= 100:  # Limit to y values within ±100
                    filter_indices.append(i)
            
            x_values = [x_values[i] for i in filter_indices]
            y_values = [y_values[i] for i in filter_indices]
            
        except Exception as e:
            return jsonify({'error': f"Error evaluating function: {str(e)}"}), 400
        
        # Return the data
        return jsonify({
            'x_values': x_values,
            'y_values': y_values,
            'equation': equation
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
