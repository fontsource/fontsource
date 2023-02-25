import { intro, group, text, outro } from '@clack/prompts';

export const create = async () => {
	intro('fontsource')
	const details = await group({
		name: () => text({
			message: 'What is the name of the font?',
			placeholder: 'Noto Sans JP',
			validate(value) { if (!value) return 'Please enter a name' }
		}),
	})

	outro("You're all set!")
}
