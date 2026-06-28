from flask import Flask, request, jsonify
import score

app = Flask(__name__)

@app.route('/submit', methods=['POST'])
def send_data():
    data = request.get_json()
    result = score.score_perplexity(data.get("text"))
    return jsonify({"score": result["score"], "status": "received", "reason":result["reason"]}), 200

if __name__ == '__main__':
    app.run(debug=True)
