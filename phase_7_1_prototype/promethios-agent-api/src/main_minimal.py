import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.routes.trust_boundaries import trust_boundaries_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes to allow frontend communication
CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Register only the trust boundaries blueprint for testing
app.register_blueprint(trust_boundaries_bp)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database (using single db instance)
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Main health check endpoint
    """
    return {
        'status': 'healthy',
        'service': 'promethios-agent-api-minimal',
        'version': '1.0.0',
        'endpoints': {
            'trust_boundaries': '/api/trust',
        }
    }, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004, debug=True)

