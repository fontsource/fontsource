// No change
export const exampleConfig1 = {
	packages: ['src/changed/fixtures/test1/', 'src/changed/fixtures/test2/'],
	ignoreExtension: [],
	commitMessage: 'chore: release new versions',
	commitFrom: '324088cb56010ce93a595eca2645840203c934b7',
	commitTo: '9b6fc2119d093ae5605f8725c6d7a70e9be291b1',
};

// All changes
export const exampleConfig2 = {
	packages: ['src/changed/fixtures/'],
	ignoreExtension: [],
	commitMessage: 'chore: release new versions',
	commitFrom: 'd08dd26bd63748ac7961f45d3bf46f7ef42f41d1',
	commitTo: '7543c880fea5f70fb3ca5ac860be0fda2140e19d',
};

// Test 2 multiple subdirectory changes
export const exampleConfig3 = {
	packages: ['src/changed/fixtures/'],
	ignoreExtension: [],
	commitMessage: 'chore: release new versions',
	commitFrom: '7543c880fea5f70fb3ca5ac860be0fda2140e19d',
	commitTo: '5059b64905315d7fdc2dcdfcdee51d052945ddf2',
};

// Ignore ts files
export const exampleConfig4 = {
	packages: ['src/changed/fixtures/'],
	ignoreExtension: ['.ts'],
	commitMessage: 'chore: release new versions',
	commitFrom: '7543c880fea5f70fb3ca5ac860be0fda2140e19d',
	commitTo: '5059b64905315d7fdc2dcdfcdee51d052945ddf2',
};

// Remove test 3, change 2 packages
export const exampleConfig5 = {
	packages: ['src/changed/fixtures/'],
	ignoreExtension: [],
	commitMessage: 'chore: release new versions',
	commitFrom: '5059b64905315d7fdc2dcdfcdee51d052945ddf2',
	commitTo: 'f1ac53d7aa55ad07fe7df61b5ec810edc49e9fba',
};
