import subprocess

remote_node_script = """
const { getDb } = require('/home/ubuntu/project/mahjong.aquaco.work/app/server/db.js');
const db = getDb();
const now = new Date().toISOString();

const s = db.prepare("UPDATE sessions SET status = 'canceled', finished_at = ? WHERE status != 'finished'").run(now);
console.log('Canceled sessions:', s.changes);

const t = db.prepare("UPDATE tables SET current_session_id = NULL").run();
console.log('Reset tables:', t.changes);

const q = db.prepare("UPDATE queue SET status = 'canceled', updated_at = ? WHERE status IN ('waiting', 'playing')").run(now);
console.log('Cleared queue:', q.changes);
"""

p = subprocess.run(
    ["ssh", "aws-aquaco-work", "node"],
    input=remote_node_script,
    capture_output=True,
    text=True,
)
print("STDOUT:", p.stdout)
print("STDERR:", p.stderr)
print("EXIT:", p.returncode)

p2 = subprocess.run(
    ["ssh", "aws-aquaco-work", "sudo systemctl restart mahjong-api"],
    capture_output=True,
    text=True,
)
print("RESTART STDOUT:", p2.stdout)
print("RESTART STDERR:", p2.stderr)
print("RESTART EXIT:", p2.returncode)
