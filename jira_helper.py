import os
import sys
import json
import base64
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Load .env if present
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    for line in env_path.read_text(encoding='utf-8-sig').splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            os.environ.setdefault(k.strip(), v.strip())

JIRA_URL = os.getenv('JIRA_URL', '').rstrip('/')
JIRA_USERNAME = os.getenv('JIRA_USERNAME', '')
JIRA_API_TOKEN = os.getenv('JIRA_API_TOKEN', '')

if not (JIRA_URL and JIRA_USERNAME and JIRA_API_TOKEN):
    print("Ошибка: JIRA_URL, JIRA_USERNAME или JIRA_API_TOKEN не заданы в .env")
    sys.exit(1)

auth_str = base64.b64encode(f"{JIRA_USERNAME}:{JIRA_API_TOKEN}".encode('utf-8')).decode('ascii')
HEADERS = {
    'Authorization': f'Basic {auth_str}',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
}

def api_get(endpoint):
    url = f"{JIRA_URL}/rest/api/3/{endpoint.lstrip('/')}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def api_post(endpoint, payload):
    url = f"{JIRA_URL}/rest/api/3/{endpoint.lstrip('/')}"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=HEADERS, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        print("API ERROR:", e.code, e.read().decode('utf-8'))
        raise

def list_issues(project_key='SCRUM'):
    q = urllib.parse.urlencode({'jql': f'project = {project_key} ORDER BY created DESC'})
    res = api_get(f'search/jql?{q}')
    issues_raw = res.get('issues', [])
    print(f"Задачи проекта {project_key}:")
    for item in issues_raw:
        iid = item.get('id')
        issue = api_get(f'issue/{iid}')
        key = issue.get('key')
        summary = issue.get('fields', {}).get('summary', '')
        status = issue.get('fields', {}).get('status', {}).get('name', 'N/A')
        print(f"  [{key}] {summary} (Статус: {status})")

def create_issue(project_key, summary, description=""):
    payload = {
        "fields": {
            "project": {"key": project_key},
            "summary": summary,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": description or summary}]
                    }
                ]
            },
            "issuetype": {"name": "Task"}
        }
    }
    res = api_post('issue', payload)
    print(f"Задача успешно создана: {res.get('key')} ({res.get('id')})")
    return res

def transition_issue(issue_key, transition_id):
    payload = {"transition": {"id": str(transition_id)}}
    api_post(f'issue/{issue_key}/transitions', payload)
    print(f"Статус задачи {issue_key} успешно обновлен (transition: {transition_id})")

def add_comment(issue_key, text):
    payload = {
        "body": {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": text}]
                }
            ]
        }
    }
    api_post(f'issue/{issue_key}/comment', payload)
    print(f"Комментарий добавлен к задаче {issue_key}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == 'list':
            proj = sys.argv[2] if len(sys.argv) > 2 else 'SCRUM'
            list_issues(proj)
        elif cmd == 'create':
            proj = sys.argv[2]
            summ = sys.argv[3]
            desc = sys.argv[4] if len(sys.argv) > 4 else ""
            create_issue(proj, summ, desc)
        elif cmd == 'transition':
            issue_key = sys.argv[2]
            t_id = sys.argv[3]
            transition_issue(issue_key, t_id)
        elif cmd == 'comment':
            issue_key = sys.argv[2]
            txt = sys.argv[3]
            add_comment(issue_key, txt)
        else:
            print(f"Неизвестная команда: {cmd}")
    else:
        list_issues()
