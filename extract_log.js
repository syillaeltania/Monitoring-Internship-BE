import fs from 'fs';
import path from 'path';

function findInTasks() {
  const tasksDir = '/Users/syilla/.gemini/antigravity-ide/brain/d0dfe6cb-4772-43df-bf2f-8a5fd11e045a/.system_generated/tasks';
  if (!fs.existsSync(tasksDir)) {
    console.log('No tasks dir');
    return;
  }
  const files = fs.readdirSync(tasksDir);
  for (const file of files) {
    const fullPath = path.join(tasksDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('ALL TEAM REQUIREMENTS IN DB')) {
      fs.writeFileSync('/Users/syilla/Documents/Monitoring Internship/BE/team_reqs_backup.json', content);
      console.log('Saved to team_reqs_backup.json from ' + file);
      return;
    }
  }
  console.log('Not found in tasks');
}

findInTasks();
