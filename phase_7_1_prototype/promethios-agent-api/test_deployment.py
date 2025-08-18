from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/test-deployment', methods=['GET'])
def test_deployment():
    return jsonify({
        'status': 'success',
        'message': 'New deployment is active',
        'timestamp': '2025-08-18-final-test'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
