import os 

old_file_names = [
'uncut-sans-300-italic.woff',
'uncut-sans-300-italic.woff2',
'uncut-sans-300.woff',
'uncut-sans-300.woff2',
'uncut-sans-400-italic.woff',
'uncut-sans-400-italic.woff2',
'uncut-sans-400.woff',
'uncut-sans-400.woff2',
'uncut-sans-500-italic.woff',
'uncut-sans-500-italic.woff2',
'uncut-sans-500.woff',
'uncut-sans-500.woff2',
'uncut-sans-600-italic.woff',
'uncut-sans-600-italic.woff2',
'uncut-sans-600.woff',
'uncut-sans-600.woff2',
'uncut-sans-700-italic.woff',
'uncut-sans-700-italic.woff2',
'uncut-sans-700.woff2',
]

new_file_names = [
'uncut-sans-latin-300-italic.woff',
'uncut-sans-latin-300-italic.woff2',
'uncut-sans-latin-300-normal.woff',
'uncut-sans-latin-300-normal.woff2',
'uncut-sans-latin-400-italic.woff',
'uncut-sans-latin-400-italic.woff2',
'uncut-sans-latin-400-normal.woff',
'uncut-sans-latin-400-normal.woff2',
'uncut-sans-latin-500-italic.woff',
'uncut-sans-latin-500-italic.woff2',
'uncut-sans-latin-500-normal.woff',
'uncut-sans-latin-500-normal.woff2',
'uncut-sans-latin-600-italic.woff',
'uncut-sans-latin-600-italic.woff2',
'uncut-sans-latin-600-normal.woff',
'uncut-sans-latin-600-normal.woff2',
'uncut-sans-latin-700-italic.woff',
'uncut-sans-latin-700-italic.woff2',
'uncut-sans-latin-700-normal.woff2',
]

for i in range(len(old_file_names)):
    os.rename(old_file_names[i], new_file_names[i])