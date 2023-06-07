// To catch 404 errors for pathless boundary layer - refer to https://github.com/remix-run/remix/issues/1136
export async function loader() {
	throw new Response('Not Found', {
		status: 404,
	});
}

export default function NotFound() {
	return <></>;
}
