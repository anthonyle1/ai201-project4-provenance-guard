from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/submit', methods=['POST'])
def send_data():
    data = request.get_json()
    return jsonify({"status": "received", "text": data.get("text"), "creator_id": data.get("creator_id")}), 200

if __name__ == '__main__':
    app.run(debug=True)
