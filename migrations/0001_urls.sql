CREATE TABLE url (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  i TEXT UNIQUE CHECK (i IS NULL OR length(i) <= 20),
  k TEXT CHECK (k IS NULL OR length(k) <= 20),
  u TEXT CHECK (u IS NULL OR length(u) <= 800),
  e TEXT CHECK (e IS NULL OR length(e) <= 80),
  g TEXT CHECK (g IS NULL OR length(g) <= 80),
  h INTEGER,
  ctime TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%f', 'now'))
);
