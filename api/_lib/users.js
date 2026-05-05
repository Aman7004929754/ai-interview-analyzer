import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import XLSX from 'xlsx';

const USERS_FILE = join(process.cwd(), 'api', '_data', 'users.xlsx');

/**
 * Initialize the users Excel file with default user if it doesn't exist.
 */
function ensureUsersFile() {
  if (!existsSync(USERS_FILE)) {
    const wb = XLSX.utils.book_new();
    const defaultUsers = [
      { username: 'Saksham', password: '1234', email: 'saksham@example.com', createdAt: new Date().toISOString() }
    ];
    const ws = XLSX.utils.json_to_sheet(defaultUsers);
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, USERS_FILE);
  }
}

/**
 * Read all users from the Excel sheet.
 */
function readUsers() {
  ensureUsersFile();
  const wb = XLSX.readFile(USERS_FILE);
  const ws = wb.Sheets['Users'];
  return XLSX.utils.sheet_to_json(ws);
}

/**
 * Add a new user to the Excel sheet.
 */
function addUser(username, password, email) {
  const users = readUsers();

  // Check if user already exists
  const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return { success: false, error: 'User already exists' };
  }

  users.push({
    username,
    password,
    email: email || '',
    createdAt: new Date().toISOString()
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(users);
  XLSX.utils.book_append_sheet(wb, ws, 'Users');
  XLSX.writeFile(wb, USERS_FILE);

  return { success: true };
}

/**
 * Authenticate a user against the Excel sheet.
 */
function authenticateUser(username, password) {
  const users = readUsers();
  const user = users.find(
    u => u.username.toLowerCase() === username.toLowerCase() && String(u.password) === String(password)
  );

  if (user) {
    return { success: true, user: { username: user.username, email: user.email } };
  }
  return { success: false, error: 'Invalid username or password' };
}

export { ensureUsersFile, readUsers, addUser, authenticateUser };
