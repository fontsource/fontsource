import { useMantineTheme } from '@mantine/core';

import type { IconProps } from './types';

const IconFly = ({ height, ...others }: IconProps) => {
	const theme = useMantineTheme();
	if (theme.colorScheme === 'dark') {
		return (
			<svg
				height={height ?? 100}
				viewBox="0 0 300 89"
				xmlns="http://www.w3.org/2000/svg"
				fillRule="evenodd"
				clipRule="evenodd"
				strokeLinejoin="round"
				strokeMiterlimit="2"
				{...others}
			>
				<path
					d="M66.522 11.742h10.954c9.743 0 17.653 7.91 17.653 17.653v38.517c0 9.743-7.91 17.653-17.653 17.653h-.863c-5.015-.784-7.19-2.288-8.87-3.559L53.816 70.555a1.968 1.968 0 00-2.466 0l-4.524 3.721-12.743-10.478a1.96 1.96 0 00-2.464 0L13.915 79.371c-3.562 2.898-5.919 2.363-7.447 2.195C2.52 78.326 0 73.411 0 67.912V29.395c0-9.743 7.91-17.653 17.654-17.653h10.93l-.02.044-.368 1.074-.115.368-.496 2.201-.068.385-.218 2.204-.029.605-.005.212.021 1.01.05.593.123.926.156.835.186.768.241.832.625 1.761.207.528 1.089 2.301.384.707 1.26 2.162.482.78 1.758 2.588.253.343 2.288 2.977.739.916 2.611 3.053.537.588 2.153 2.316.852.883 1.409 1.4-.282.236-.177.159c-.478.446-.932.92-1.357 1.418-.205.241-.4.49-.584.746a9.78 9.78 0 00-.755 1.233 7.336 7.336 0 00-.302.685 6.35 6.35 0 00-.409 1.86l-.008.551c.02.776.178 1.542.467 2.263.292.73.719 1.399 1.258 1.973.392.417.838.781 1.327 1.08a6.76 6.76 0 001.321.624 7.401 7.401 0 003.119.355h.005a7.04 7.04 0 002.573-.764c.345-.183.674-.395.982-.636a6.288 6.288 0 001.981-2.635c.325-.81.484-1.675.47-2.546l-.026-.456a6.43 6.43 0 00-.426-1.753 7.348 7.348 0 00-.33-.716 9.82 9.82 0 00-.777-1.229 12.31 12.31 0 00-.41-.525 16.823 16.823 0 00-1.515-1.587l-.382-.325.646-.637 2.774-2.897.959-1.053 1.491-1.678.97-1.134 1.383-1.685.937-1.177 1.375-1.839.694-.951.985-1.473.82-1.254 1.546-2.692.884-1.766.025-.054.677-1.638a.56.56 0 00.023-.065l.729-2.274.076-.331.317-1.81.061-.49.019-.3.022-1.133-.006-.211-.058-1.015-.072-.788-.359-2.272a.975.975 0 00-.021-.09l-.461-1.68-.159-.467-.207-.517zm5.207 48.032a4.262 4.262 0 00-4.183 4.183c.033 2.281 1.901 4.148 4.183 4.181 2.281-.033 4.149-1.9 4.184-4.181a4.263 4.263 0 00-4.184-4.183z"
					fill="url(#_Radial1)"
				/>
				<path
					d="M207.646 74.498l-12.457-26.666c-1.04-2.222-1.66-3.034-2.701-3.976l-1.012-.913c-.808-.783-1.338-1.508-1.338-2.369 0-1.233.976-2.271 2.755-2.271h10.815c1.697 0 2.755.883 2.755 2.201 0 .736-.338 1.288-.766 1.829-.507.643-1.168 1.269-1.168 2.412 0 .716.209 1.43.611 2.342l7.434 17.408 6.668-16.97c.41-1.129.69-2.123.69-2.919 0-1.239-.673-1.744-1.192-2.298-.452-.481-.813-.989-.813-1.804 0-1.331 1.083-2.201 2.541-2.201h6.66c1.867 0 2.755.966 2.755 2.201 0 .79-.455 1.523-1.351 2.313l-.942.774c-1.312 1.072-1.919 2.622-2.608 4.226l-10.099 24.329c-1.193 2.844-2.97 6.793-5.683 10.033-2.757 3.29-6.474 5.849-11.508 5.849-4.215 0-6.767-2.013-6.767-4.913 0-2.657 1.965-4.774 4.547-4.774 1.414 0 2.149.668 2.895 1.355.617.566 1.243 1.148 2.477 1.148 1.144 0 2.21-.484 3.177-1.266 1.476-1.194 2.712-3.073 3.625-5.08zM63.494 85.565h-21.51c-1.102 0-1.256-1.044-.547-1.638 10.499-8.795 10.474-8.824 10.474-8.824a1.158 1.158 0 011.484-.003s9.867 8.174 10.646 8.827c.709.594.556 1.638-.547 1.638zm217.35-11.162c5.607 0 10.201-1.921 13.784-5.755C298.209 64.82 300 60.212 300 54.824c0-5.259-1.702-9.58-5.093-12.966-3.391-3.385-7.79-5.085-13.204-5.085-5.701 0-10.363 1.851-13.994 5.539-3.632 3.691-5.449 8.162-5.449 13.415 0 5.205 1.734 9.618 5.195 13.237 3.464 3.622 7.925 5.439 13.389 5.439zm-47.413-.417c3.242 0 5.547-2.183 5.547-5.33 0-3.073-2.381-5.26-5.547-5.26-3.318 0-5.692 2.191-5.692 5.26 0 3.144 2.376 5.33 5.692 5.33zm11.544-4.988l.79-.834c.938-.912 1.24-1.833 1.24-4.373V48.776c0-2.196-.298-3.176-1.23-4.015l-.928-.832c-.91-.803-1.209-1.302-1.209-2.104 0-1.14.884-2.075 2.306-2.399l6.303-1.53c.603-.146 1.283-.288 1.81-.288.725 0 1.319.238 1.735.652.417.415.662 1.011.662 1.758v23.773c0 2.397.291 3.512 1.292 4.354a.478.478 0 01.045.045l.705.821c.885.861 1.252 1.432 1.252 2.217 0 1.401-1.056 2.202-2.754 2.202h-10.672c-1.618 0-2.684-.796-2.684-2.202 0-.789.368-1.365 1.337-2.23zm-71.334.001l.789-.835c.939-.912 1.241-1.833 1.241-4.373v-31.35c0-2.126-.225-3.17-1.22-4.008l-.953-.922c-.821-.798-1.121-1.293-1.121-2.091 0-1.142.888-2.073 2.232-2.399l6.231-1.529c.604-.146 1.283-.289 1.811-.289.72 0 1.329.217 1.764.628.436.413.704 1.026.704 1.852v40.108c0 2.403.299 3.454 1.304 4.363l.804.851c.891.867 1.188 1.434 1.188 2.223 0 .582-.178 1.051-.494 1.409-.446.504-1.193.793-2.19.793H175.06c-.996 0-1.744-.289-2.191-.793-.315-.358-.492-.827-.492-1.409 0-.79.293-1.362 1.264-2.229zm-29.058-16.145v10.798c0 1.627.322 3.129 1.662 4.366l.867.841c.971.942 1.266 1.506 1.266 2.369 0 1.319-1.057 2.202-2.755 2.202h-12.032c-1.698 0-2.755-.883-2.755-2.202 0-1.024.301-1.509 1.271-2.374l.864-.839c1.005-.91 1.661-2.151 1.661-4.363V34.805c0-1.758-.389-3.196-1.662-4.367l-.868-.841c-.892-.866-1.266-1.435-1.266-2.3 0-1.398 1.061-2.271 2.755-2.271h32.23c1.231 0 2.314.274 3.005.952.481.472.788 1.137.823 2.06l.502 7.44c.05.93-.225 1.706-.761 2.184-.37.329-.867.526-1.493.526-.789 0-1.394-.298-1.934-.812-.485-.462-.917-1.111-1.405-1.875-1.177-1.881-1.725-2.558-2.98-3.438-1.746-1.288-4.407-1.731-9.437-1.731-2.903 0-4.735.127-5.889.424-.746.193-1.177.443-1.407.81-.237.376-.262.851-.262 1.431v14.62h7.558c1.808 0 3.08-.327 4.554-2.341l.008-.012c.591-.752 1.019-1.306 1.426-1.673.473-.429.929-.632 1.532-.632a2.212 2.212 0 012.182 2.203v10.079c0 1.35-1.052 2.271-2.182 2.271-.562 0-1.018-.2-1.493-.62-.409-.359-.838-.898-1.394-1.617-1.613-2.088-2.752-2.421-4.633-2.421h-7.558zm127.7-.255c0-3.616.788-6.215 2.42-7.778 1.613-1.543 3.346-2.324 5.209-2.324 2.563 0 4.873 1.435 6.956 4.255 2.128 2.884 3.181 6.781 3.181 11.686 0 3.62-.79 6.243-2.425 7.851-1.611 1.586-3.343 2.39-5.205 2.39-2.563 0-4.871-1.446-6.955-4.288-2.129-2.908-3.181-6.841-3.181-11.792zM47.625 50.485l.112.032c.035.018.066.043.098.065l.093.082c.229.211.452.433.666.66.151.161.298.327.439.498.18.217.348.444.501.68.066.104.127.21.185.32.05.095.095.193.134.293.07.174.122.357.138.543l-.003.35a1.997 1.997 0 01-.947 1.556c-.35.212-.744.342-1.151.379l-.433.013-.365-.032a2.795 2.795 0 01-.501-.122 2.419 2.419 0 01-.475-.222l-.285-.209a1.952 1.952 0 01-.649-1.112 2.741 2.741 0 01-.034-.221l-.01-.333a1.63 1.63 0 01.039-.269c.05-.195.122-.384.212-.563.117-.225.25-.442.399-.648.247-.333.514-.651.8-.951.185-.195.373-.384.57-.565l.141-.127c.097-.065.098-.065.209-.097h.117zm-.717-46.522l.045-.004V42.97l-.097-.18a109.393 109.393 0 01-3.584-7.262 77.906 77.906 0 01-2.432-6.089 48 48 0 01-1.465-5.013c-.309-1.348-.545-2.715-.642-4.096a19.74 19.74 0 01-.034-1.771c.009-.514.03-1.027.063-1.541.051-.807.133-1.613.251-2.412.094-.629.21-1.256.353-1.876.114-.492.246-.981.397-1.462.218-.695.478-1.374.782-2.037.111-.239.23-.476.356-.709.753-1.395 1.775-2.68 3.113-3.54a6.509 6.509 0 012.894-1.019zm5.059.098l2.624.749a16.01 16.01 0 013.461 1.763 13.88 13.88 0 013.722 3.712 14.085 14.085 0 011.441 2.779 16.272 16.272 0 011.003 4.499c.035.403.055.807.063 1.212.009.375.007.752-.023 1.127a12.76 12.76 0 01-.472 2.48 19.491 19.491 0 01-.68 1.951 27.983 27.983 0 01-1.08 2.332c-.875 1.69-1.881 3.306-2.959 4.869a75.975 75.975 0 01-4.267 5.568 105.805 105.805 0 01-5.119 5.674 108.121 108.121 0 003.369-6.894 85.38 85.38 0 001.638-3.947 61.629 61.629 0 001.526-4.439 43.79 43.79 0 00.878-3.404c.209-.984.374-1.978.476-2.978.085-.834.117-1.673.096-2.509a35.765 35.765 0 00-.057-1.536c-.123-2.057-.436-4.108-1.036-6.081a17.657 17.657 0 00-.827-2.193c-.768-1.673-1.84-3.237-3.291-4.378l-.486-.356zm199.226 28.983c3.249 0 5.547-1.829 5.547-4.983 0-3.079-2.296-4.912-5.547-4.912-3.327 0-5.621 1.834-5.621 4.912s2.295 4.983 5.621 4.983z"
					fill="#fff"
				/>
				<defs>
					<radialGradient
						id="_Radial1"
						cx="0"
						cy="0"
						r="1"
						gradientUnits="userSpaceOnUse"
						gradientTransform="matrix(64.8945 0 0 69.4772 47.564 48.653)"
					>
						<stop offset="0" stopColor="#ba7bf0" />
						<stop offset=".43" stopColor="#996bec" />
						<stop offset="1" stopColor="#5046e4" />
					</radialGradient>
				</defs>
			</svg>
		);
	}

	return (
		<svg
			height={height ?? 100}
			viewBox="0 0 300 89"
			xmlns="http://www.w3.org/2000/svg"
			fillRule="evenodd"
			clipRule="evenodd"
			strokeLinejoin="round"
			strokeMiterlimit="2"
			{...others}
		>
			<path
				d="M66.522 11.742h10.954c9.743 0 17.653 7.91 17.653 17.653v38.517c0 9.743-7.91 17.653-17.653 17.653h-.863c-5.015-.784-7.19-2.288-8.87-3.559L53.816 70.555a1.968 1.968 0 00-2.466 0l-4.524 3.721-12.743-10.478a1.96 1.96 0 00-2.464 0L13.915 79.371c-3.562 2.898-5.919 2.363-7.447 2.195C2.52 78.326 0 73.411 0 67.912V29.395c0-9.743 7.91-17.653 17.654-17.653h10.93l-.02.044-.368 1.074-.115.368-.496 2.201-.068.385-.218 2.204-.029.605-.005.212.021 1.01.05.593.123.926.156.835.186.768.241.832.625 1.761.207.528 1.089 2.301.384.707 1.26 2.162.482.78 1.758 2.588.253.343 2.288 2.977.739.916 2.611 3.053.537.588 2.153 2.316.852.883 1.409 1.4-.282.236-.177.159c-.478.446-.932.92-1.357 1.418-.205.241-.4.49-.584.746a9.78 9.78 0 00-.755 1.233 7.336 7.336 0 00-.302.685 6.35 6.35 0 00-.409 1.86l-.008.551c.02.776.178 1.542.467 2.263.292.73.719 1.399 1.258 1.973.392.417.838.781 1.327 1.08a6.76 6.76 0 001.321.624 7.401 7.401 0 003.119.355h.005a7.04 7.04 0 002.573-.764c.345-.183.674-.395.982-.636a6.288 6.288 0 001.981-2.635c.325-.81.484-1.675.47-2.546l-.026-.456a6.43 6.43 0 00-.426-1.753 7.348 7.348 0 00-.33-.716 9.82 9.82 0 00-.777-1.229 12.31 12.31 0 00-.41-.525 16.823 16.823 0 00-1.515-1.587l-.382-.325.646-.637 2.774-2.897.959-1.053 1.491-1.678.97-1.134 1.383-1.685.937-1.177 1.375-1.839.694-.951.985-1.473.82-1.254 1.546-2.692.884-1.766.025-.054.677-1.638a.56.56 0 00.023-.065l.729-2.274.076-.331.317-1.81.061-.49.019-.3.022-1.133-.006-.211-.058-1.015-.072-.788-.359-2.272a.975.975 0 00-.021-.09l-.461-1.68-.159-.467-.207-.517zm5.207 48.032a4.262 4.262 0 00-4.183 4.183c.033 2.281 1.901 4.148 4.183 4.181 2.281-.033 4.149-1.9 4.184-4.181a4.263 4.263 0 00-4.184-4.183z"
				fill="url(#_Radial1)"
			/>
			<path
				d="M207.646 74.498l-12.457-26.666c-1.04-2.222-1.66-3.034-2.701-3.976l-1.012-.913c-.808-.783-1.338-1.508-1.338-2.369 0-1.233.976-2.271 2.755-2.271h10.815c1.697 0 2.755.883 2.755 2.201 0 .736-.338 1.288-.766 1.829-.507.643-1.168 1.269-1.168 2.412 0 .716.209 1.43.611 2.342l7.434 17.408 6.668-16.97c.41-1.129.69-2.123.69-2.919 0-1.239-.673-1.744-1.192-2.298-.452-.481-.813-.989-.813-1.804 0-1.331 1.083-2.201 2.541-2.201h6.66c1.867 0 2.755.966 2.755 2.201 0 .79-.455 1.523-1.351 2.313l-.942.774c-1.312 1.072-1.919 2.622-2.608 4.226l-10.099 24.329c-1.193 2.844-2.97 6.793-5.683 10.033-2.757 3.29-6.474 5.849-11.508 5.849-4.215 0-6.767-2.013-6.767-4.913 0-2.657 1.965-4.774 4.547-4.774 1.414 0 2.149.668 2.895 1.355.617.566 1.243 1.148 2.477 1.148 1.144 0 2.21-.484 3.177-1.266 1.476-1.194 2.712-3.073 3.625-5.08zM38.137 85.565H17.654a17.58 17.58 0 01-11.186-3.999c1.528.168 3.885.703 7.447-2.195l17.704-15.573a1.96 1.96 0 012.464 0l12.743 10.478 4.524-3.721a1.968 1.968 0 012.466 0l13.927 11.451c1.68 1.271 3.855 2.775 8.87 3.559h-9.265a3.94 3.94 0 01-2.274-.757l-.163-.125-12.256-10.178L40.56 84.683a3.875 3.875 0 01-2.423.882zm242.707-11.162c5.607 0 10.201-1.921 13.784-5.755C298.209 64.82 300 60.212 300 54.824c0-5.259-1.702-9.58-5.093-12.966-3.391-3.385-7.79-5.085-13.204-5.085-5.701 0-10.363 1.851-13.994 5.539-3.632 3.691-5.449 8.162-5.449 13.415 0 5.205 1.734 9.618 5.195 13.237 3.464 3.622 7.925 5.439 13.389 5.439zm-47.413-.417c3.242 0 5.547-2.183 5.547-5.33 0-3.073-2.381-5.26-5.547-5.26-3.318 0-5.692 2.191-5.692 5.26 0 3.144 2.376 5.33 5.692 5.33zm11.544-4.988l.79-.834c.938-.912 1.24-1.833 1.24-4.373V48.776c0-2.196-.298-3.176-1.23-4.015l-.928-.832c-.91-.803-1.209-1.302-1.209-2.104 0-1.14.884-2.075 2.306-2.399l6.303-1.53c.603-.146 1.283-.288 1.81-.288.725 0 1.319.238 1.735.652.417.415.662 1.011.662 1.758v23.773c0 2.397.291 3.512 1.292 4.354a.478.478 0 01.045.045l.705.821c.885.861 1.252 1.432 1.252 2.217 0 1.401-1.056 2.202-2.754 2.202h-10.672c-1.618 0-2.684-.796-2.684-2.202 0-.789.368-1.365 1.337-2.23zm-71.334.001l.789-.835c.939-.912 1.241-1.833 1.241-4.373v-31.35c0-2.126-.225-3.17-1.22-4.008l-.953-.922c-.821-.798-1.121-1.293-1.121-2.091 0-1.142.888-2.073 2.232-2.399l6.231-1.529c.604-.146 1.283-.289 1.811-.289.72 0 1.329.217 1.764.628.436.413.704 1.026.704 1.852v40.108c0 2.403.299 3.454 1.304 4.363l.804.851c.891.867 1.188 1.434 1.188 2.223 0 .582-.178 1.051-.494 1.409-.446.504-1.193.793-2.19.793H175.06c-.996 0-1.744-.289-2.191-.793-.315-.358-.492-.827-.492-1.409 0-.79.293-1.362 1.264-2.229zm-29.058-16.145v10.798c0 1.627.322 3.129 1.662 4.366l.867.841c.971.942 1.266 1.506 1.266 2.369 0 1.319-1.057 2.202-2.755 2.202h-12.032c-1.698 0-2.755-.883-2.755-2.202 0-1.024.301-1.509 1.271-2.374l.864-.839c1.005-.91 1.661-2.151 1.661-4.363V34.805c0-1.758-.389-3.196-1.662-4.367l-.868-.841c-.892-.866-1.266-1.435-1.266-2.3 0-1.398 1.061-2.271 2.755-2.271h32.23c1.231 0 2.314.274 3.005.952.481.472.788 1.137.823 2.06l.502 7.44c.05.93-.225 1.706-.761 2.184-.37.329-.867.526-1.493.526-.789 0-1.394-.298-1.934-.812-.485-.462-.917-1.111-1.405-1.875-1.177-1.881-1.725-2.558-2.98-3.438-1.746-1.288-4.407-1.731-9.437-1.731-2.903 0-4.735.127-5.889.424-.746.193-1.177.443-1.407.81-.237.376-.262.851-.262 1.431v14.62h7.558c1.808 0 3.08-.327 4.554-2.341l.008-.012c.591-.752 1.019-1.306 1.426-1.673.473-.429.929-.632 1.532-.632a2.212 2.212 0 012.182 2.203v10.079c0 1.35-1.052 2.271-2.182 2.271-.562 0-1.018-.2-1.493-.62-.409-.359-.838-.898-1.394-1.617-1.613-2.088-2.752-2.421-4.633-2.421h-7.558zm127.7-.255c0-3.616.788-6.215 2.42-7.778 1.613-1.543 3.346-2.324 5.209-2.324 2.563 0 4.873 1.435 6.956 4.255 2.128 2.884 3.181 6.781 3.181 11.686 0 3.62-.79 6.243-2.425 7.851-1.611 1.586-3.343 2.39-5.205 2.39-2.563 0-4.871-1.446-6.955-4.288-2.129-2.908-3.181-6.841-3.181-11.792zM71.729 59.774a4.262 4.262 0 00-4.183 4.183c.033 2.281 1.901 4.148 4.183 4.181 2.281-.033 4.149-1.9 4.184-4.181a4.263 4.263 0 00-4.184-4.183zm-27.04-12.672l-1.409-1.4-.852-.883-2.153-2.316-.537-.588-2.611-3.053-.739-.916-2.288-2.977-.253-.343-1.758-2.588-.482-.78-1.26-2.162-.384-.707-1.089-2.301-.207-.528-.625-1.761-.241-.832-.186-.768-.156-.835-.123-.926-.05-.593-.021-1.01.005-.212.029-.605.218-2.204.068-.385.496-2.201.115-.368.368-1.074.118-.278.587-1.289.406-.767.567-.934.564-.831.402-.529.464-.558.51-.561.436-.439 1.064-.936.778-.637c.018-.016.038-.03.057-.044l.92-.622.732-.466 1.388-.731c.02-.012.045-.023.067-.033l1.968-.817.182-.068 1.75-.513.739-.165.999-.201.663-.101L44.941.14l.693-.061 1.375-.073.539-.006 1.02.021.266.015 1.478.123 1.956.275.226.048 1.933.481.567.169.631.218.768.291.607.257.892.42.562.289 1.01.593.377.232 1.378 1.006.395.343.96.874.048.048.814.874.281.316.956 1.27.194.303.759 1.282.228.439.428.956.447 1.116.159.467.461 1.68a.655.655 0 01.021.09l.359 2.272.072.788.058 1.015.006.211-.022 1.133-.019.3-.061.49-.317 1.81-.076.331-.729 2.274a.56.56 0 01-.023.065l-.677 1.638-.025.054-.884 1.766-1.546 2.692-.82 1.254-.985 1.473-.694.951-1.375 1.839-.937 1.177-1.383 1.685-.97 1.134-1.491 1.678-.959 1.053-2.774 2.897-.646.637.382.325a16.951 16.951 0 011.515 1.587c.142.171.278.346.41.525.289.39.549.801.777 1.229.122.232.233.472.33.716.221.561.371 1.154.426 1.753l.026.456a6.566 6.566 0 01-.47 2.546 6.288 6.288 0 01-1.981 2.635 6.645 6.645 0 01-.982.636 7.04 7.04 0 01-2.573.764h-.005a7.401 7.401 0 01-3.119-.355 6.76 6.76 0 01-1.321-.624 6.385 6.385 0 01-1.327-1.08 6.302 6.302 0 01-1.258-1.973 6.534 6.534 0 01-.467-2.263l.008-.551a6.35 6.35 0 01.409-1.86c.089-.234.19-.463.302-.685.22-.43.473-.841.755-1.233.184-.256.38-.505.584-.746a17.31 17.31 0 011.357-1.418l.177-.159.282-.236zm206.504-14.058c3.249 0 5.547-1.829 5.547-4.983 0-3.079-2.296-4.912-5.547-4.912-3.327 0-5.621 1.834-5.621 4.912s2.295 4.983 5.621 4.983z"
				fill="#24175b"
			/>
			<path
				d="M52.655 74.505l12.256 10.178a3.941 3.941 0 002.479.882H38.095c.9 0 1.771-.311 2.465-.882l12.095-10.178zm-5.03-24.02l.112.032c.035.018.066.043.098.065l.093.082c.229.211.452.433.666.66.151.161.298.327.439.498.18.217.348.444.501.68.066.104.127.21.185.32.05.095.095.193.134.293.07.174.122.357.138.543l-.003.35a1.997 1.997 0 01-.947 1.556c-.35.212-.744.342-1.151.379l-.433.013-.365-.032a2.795 2.795 0 01-.501-.122 2.419 2.419 0 01-.475-.222l-.285-.209a1.952 1.952 0 01-.649-1.112 2.741 2.741 0 01-.034-.221l-.01-.333a1.63 1.63 0 01.039-.269c.05-.195.122-.384.212-.563.117-.225.25-.442.399-.648.247-.333.514-.651.8-.951.185-.195.373-.384.57-.565l.141-.127c.097-.065.098-.065.209-.097h.117zm-.717-46.522l.045-.004V42.97l-.097-.18a109.393 109.393 0 01-3.584-7.262 77.906 77.906 0 01-2.432-6.089 48 48 0 01-1.465-5.013c-.309-1.348-.545-2.715-.642-4.096a19.74 19.74 0 01-.034-1.771c.009-.514.03-1.027.063-1.541.051-.807.133-1.613.251-2.412.094-.629.21-1.256.353-1.876.114-.492.246-.981.397-1.462.218-.695.478-1.374.782-2.037.111-.239.23-.476.356-.709.753-1.395 1.775-2.68 3.113-3.54a6.509 6.509 0 012.894-1.019zm5.059.098l2.624.749a16.01 16.01 0 013.461 1.763 13.88 13.88 0 013.722 3.712 14.085 14.085 0 011.441 2.779 16.272 16.272 0 011.003 4.499c.035.403.055.807.063 1.212.009.375.007.752-.023 1.127a12.76 12.76 0 01-.472 2.48 19.491 19.491 0 01-.68 1.951 27.983 27.983 0 01-1.08 2.332c-.875 1.69-1.881 3.306-2.959 4.869a75.975 75.975 0 01-4.267 5.568 105.805 105.805 0 01-5.119 5.674 108.121 108.121 0 003.369-6.894 85.38 85.38 0 001.638-3.947 61.629 61.629 0 001.526-4.439 43.79 43.79 0 00.878-3.404c.209-.984.374-1.978.476-2.978.085-.834.117-1.673.096-2.509a35.765 35.765 0 00-.057-1.536c-.123-2.057-.436-4.108-1.036-6.081a17.657 17.657 0 00-.827-2.193c-.768-1.673-1.84-3.237-3.291-4.378l-.486-.356z"
				fill="#fff"
			/>
			<g>
				<path
					d="M66.515 11.741h10.953c9.742 0 17.651 7.909 17.651 17.651v38.513c0 9.742-7.909 17.652-17.651 17.652h-.863c-5.014-.785-7.189-2.288-8.869-3.559l-13.925-11.45a1.968 1.968 0 00-2.466 0l-4.524 3.72L34.08 63.791a1.964 1.964 0 00-2.465 0L13.914 79.363c-3.562 2.898-5.919 2.363-7.447 2.195C2.52 78.318 0 73.404 0 67.905V29.392c0-9.742 7.909-17.651 17.653-17.651h10.928l-.02.044-.368 1.074-.115.368-.496 2.2-.068.386-.218 2.203-.029.605-.004.212.021 1.01.049.592.123.927.157.834.185.769.241.831.626 1.761.206.529 1.089 2.3.384.707 1.26 2.162.482.78 1.757 2.588.254.343 2.287 2.976.739.916 2.611 3.053.537.588 2.152 2.316.853.882 1.409 1.4-.283.236-.176.159c-.479.446-.933.92-1.358 1.418-.204.241-.399.49-.584.746a9.588 9.588 0 00-.754 1.233 7.435 7.435 0 00-.302.684 6.325 6.325 0 00-.409 1.861l-.008.55c.02.776.178 1.542.466 2.263a6.385 6.385 0 002.585 3.053c.416.255.86.464 1.321.624a7.401 7.401 0 003.119.355h.005a7.03 7.03 0 002.572-.764c.346-.183.675-.395.983-.636a6.307 6.307 0 001.981-2.634c.324-.81.483-1.676.469-2.547l-.025-.455a6.414 6.414 0 00-.427-1.753 7.348 7.348 0 00-.33-.716 9.812 9.812 0 00-.776-1.229 12.31 12.31 0 00-.41-.525 16.956 16.956 0 00-1.516-1.587l-.381-.325.646-.637 2.773-2.896.959-1.053 1.491-1.678.97-1.134 1.383-1.684.937-1.178 1.375-1.838.694-.951.984-1.473.821-1.255 1.545-2.691.884-1.765.026-.055.676-1.638a.502.502 0 00.023-.065l.729-2.273.077-.331.316-1.81.061-.49.019-.3.022-1.133-.006-.211-.058-1.015-.072-.788-.359-2.272c-.006-.03-.011-.06-.021-.09l-.461-1.68-.159-.467-.207-.516zm5.207 48.027a4.261 4.261 0 00-4.183 4.182 4.264 4.264 0 004.183 4.181c2.281-.033 4.148-1.9 4.183-4.181-.033-2.282-1.901-4.15-4.183-4.182z"
					fill="url(#_Radial2)"
				/>
				<path
					d="M207.646 74.498l-12.457-26.666c-1.04-2.222-1.66-3.034-2.701-3.976l-1.012-.913c-.808-.783-1.338-1.508-1.338-2.369 0-1.233.976-2.271 2.755-2.271h10.815c1.697 0 2.755.883 2.755 2.201 0 .736-.338 1.288-.766 1.829-.507.643-1.168 1.269-1.168 2.412 0 .716.209 1.43.611 2.342l7.434 17.408 6.668-16.97c.41-1.129.69-2.123.69-2.919 0-1.239-.673-1.744-1.192-2.298-.452-.481-.813-.989-.813-1.804 0-1.331 1.083-2.201 2.541-2.201h6.66c1.867 0 2.755.966 2.755 2.201 0 .79-.455 1.523-1.351 2.313l-.942.774c-1.312 1.072-1.919 2.622-2.608 4.226l-10.099 24.329c-1.193 2.844-2.97 6.793-5.683 10.033-2.757 3.29-6.474 5.849-11.508 5.849-4.215 0-6.767-2.013-6.767-4.913 0-2.657 1.965-4.774 4.547-4.774 1.414 0 2.149.668 2.895 1.355.617.566 1.243 1.148 2.477 1.148 1.144 0 2.21-.484 3.177-1.266 1.476-1.194 2.712-3.073 3.625-5.08zM41.294 84.053l-.738.621a3.876 3.876 0 01-2.423.883h-20.48a17.585 17.585 0 01-11.186-3.999c1.528.167 3.885.703 7.447-2.195l17.701-15.572a1.964 1.964 0 012.465 0l12.741 10.477 4.524-3.72a1.968 1.968 0 012.466 0l13.925 11.45c1.68 1.271 3.855 2.774 8.869 3.559h-9.264a3.936 3.936 0 01-2.274-.758l-.162-.125-.688-.571a1.379 1.379 0 00-.182-.185c-.779-.652-10.645-8.826-10.645-8.826a1.16 1.16 0 00-1.484.003s.024.03-10.473 8.823a1.37 1.37 0 00-.139.135zm239.55-9.65c5.607 0 10.201-1.921 13.784-5.755C298.209 64.82 300 60.212 300 54.824c0-5.259-1.702-9.58-5.093-12.966-3.391-3.385-7.79-5.085-13.204-5.085-5.701 0-10.363 1.851-13.994 5.539-3.632 3.691-5.449 8.162-5.449 13.415 0 5.205 1.734 9.618 5.195 13.237 3.464 3.622 7.925 5.439 13.389 5.439zm-47.413-.417c3.242 0 5.547-2.183 5.547-5.33 0-3.073-2.381-5.26-5.547-5.26-3.318 0-5.692 2.191-5.692 5.26 0 3.144 2.376 5.33 5.692 5.33zm11.544-4.988l.79-.834c.938-.912 1.24-1.833 1.24-4.373V48.776c0-2.196-.298-3.176-1.23-4.015l-.928-.832c-.91-.803-1.209-1.302-1.209-2.104 0-1.14.884-2.075 2.306-2.399l6.303-1.53c.603-.146 1.283-.288 1.81-.288.725 0 1.319.238 1.735.652.417.415.662 1.011.662 1.758v23.773c0 2.397.291 3.512 1.292 4.354a.478.478 0 01.045.045l.705.821c.885.861 1.252 1.432 1.252 2.217 0 1.401-1.056 2.202-2.754 2.202h-10.672c-1.618 0-2.684-.796-2.684-2.202 0-.789.368-1.365 1.337-2.23zm-71.334.001l.789-.835c.939-.912 1.241-1.833 1.241-4.373v-31.35c0-2.126-.225-3.17-1.22-4.008l-.953-.922c-.821-.798-1.121-1.293-1.121-2.091 0-1.142.888-2.073 2.232-2.399l6.231-1.529c.604-.146 1.283-.289 1.811-.289.72 0 1.329.217 1.764.628.436.413.704 1.026.704 1.852v40.108c0 2.403.299 3.454 1.304 4.363l.804.851c.891.867 1.188 1.434 1.188 2.223 0 .582-.178 1.051-.494 1.409-.446.504-1.193.793-2.19.793H175.06c-.996 0-1.744-.289-2.191-.793-.315-.358-.492-.827-.492-1.409 0-.79.293-1.362 1.264-2.229zm-29.058-16.145v10.798c0 1.627.322 3.129 1.662 4.366l.867.841c.971.942 1.266 1.506 1.266 2.369 0 1.319-1.057 2.202-2.755 2.202h-12.032c-1.698 0-2.755-.883-2.755-2.202 0-1.024.301-1.509 1.271-2.374l.864-.839c1.005-.91 1.661-2.151 1.661-4.363V34.805c0-1.758-.389-3.196-1.662-4.367l-.868-.841c-.892-.866-1.266-1.435-1.266-2.3 0-1.398 1.061-2.271 2.755-2.271h32.23c1.231 0 2.314.274 3.005.952.481.472.788 1.137.823 2.06l.502 7.44c.05.93-.225 1.706-.761 2.184-.37.329-.867.526-1.493.526-.789 0-1.394-.298-1.934-.812-.485-.462-.917-1.111-1.405-1.875-1.177-1.881-1.725-2.558-2.98-3.438-1.746-1.288-4.407-1.731-9.437-1.731-2.903 0-4.735.127-5.889.424-.746.193-1.177.443-1.407.81-.237.376-.262.851-.262 1.431v14.62h7.558c1.808 0 3.08-.327 4.554-2.341l.008-.012c.591-.752 1.019-1.306 1.426-1.673.473-.429.929-.632 1.532-.632a2.212 2.212 0 012.182 2.203v10.079c0 1.35-1.052 2.271-2.182 2.271-.562 0-1.018-.2-1.493-.62-.409-.359-.838-.898-1.394-1.617-1.613-2.088-2.752-2.421-4.633-2.421h-7.558zm127.7-.255c0-3.616.788-6.215 2.42-7.778 1.613-1.543 3.346-2.324 5.209-2.324 2.563 0 4.873 1.435 6.956 4.255 2.128 2.884 3.181 6.781 3.181 11.686 0 3.62-.79 6.243-2.425 7.851-1.611 1.586-3.343 2.39-5.205 2.39-2.563 0-4.871-1.446-6.955-4.288-2.129-2.908-3.181-6.841-3.181-11.792zM71.722 59.768a4.261 4.261 0 00-4.183 4.182 4.264 4.264 0 004.183 4.181c2.281-.033 4.148-1.9 4.183-4.181-.033-2.282-1.901-4.15-4.183-4.182zM44.685 47.097l-1.409-1.4-.853-.882-2.152-2.316-.537-.588-2.611-3.053-.739-.916-2.287-2.976-.254-.343-1.757-2.588-.482-.78-1.26-2.162-.384-.707-1.089-2.3-.206-.529-.626-1.761-.241-.831-.185-.769-.157-.834-.123-.927-.049-.592-.021-1.01.004-.212.029-.605.218-2.203.068-.386.496-2.2.115-.368.368-1.074.119-.278.586-1.289.406-.767.567-.933.564-.832.402-.529.464-.558.509-.561.437-.439 1.064-.936.777-.636a.804.804 0 01.058-.044l.92-.622.731-.466 1.388-.731c.021-.013.045-.023.067-.033l1.968-.817.182-.069 1.75-.512.739-.165.998-.201.663-.101L44.936.14l.693-.061 1.375-.073.539-.006 1.021.021.265.015 1.478.123 1.956.275.226.048 1.932.481.568.169.63.218.768.29.607.258.892.42.562.289 1.01.593.377.232 1.377 1.005.395.343.961.875.047.047.815.874.28.316.956 1.27.195.303.759 1.282.228.439.427.956.447 1.115.159.467.461 1.68c.009.03.016.06.021.09l.359 2.272.072.788.058 1.015.006.211-.022 1.133-.019.3-.061.49-.316 1.81-.077.331-.729 2.273a.502.502 0 01-.023.065l-.676 1.638-.026.055-.884 1.765-1.545 2.691-.821 1.255-.984 1.473-.694.951-1.375 1.838-.937 1.177-1.383 1.685-.97 1.134-1.491 1.678-.959 1.053-2.773 2.896-.646.637.381.325a16.962 16.962 0 011.516 1.587c.141.171.278.346.41.525.289.39.548.801.776 1.229.123.232.233.472.33.716.222.561.371 1.154.427 1.753l.025.455a6.57 6.57 0 01-.469 2.547 6.307 6.307 0 01-1.981 2.634 6.603 6.603 0 01-.983.636 7.03 7.03 0 01-2.572.764h-.005a7.401 7.401 0 01-3.119-.355 6.788 6.788 0 01-1.321-.624 6.405 6.405 0 01-1.326-1.08 6.312 6.312 0 01-1.259-1.973 6.555 6.555 0 01-.466-2.263l.008-.55a6.325 6.325 0 01.409-1.861c.089-.234.19-.462.302-.684.22-.43.473-.841.754-1.233.184-.256.38-.505.584-.746.425-.498.879-.972 1.358-1.418l.176-.159.283-.236zm206.508-14.053c3.249 0 5.547-1.829 5.547-4.983 0-3.079-2.296-4.912-5.547-4.912-3.327 0-5.621 1.834-5.621 4.912s2.295 4.983 5.621 4.983z"
					fill="#24175b"
				/>
				<path
					d="M40.556 84.674l11.35-9.579a1.16 1.16 0 011.484-.003l11.515 9.582c.7.57 1.575.882 2.478.883H38.092c.899 0 1.77-.312 2.464-.883zM47.62 50.48l.112.032c.036.018.066.043.098.065l.093.082c.229.211.452.432.666.66.151.161.298.326.439.498.18.216.348.443.501.68.066.104.127.209.185.32.05.095.095.193.134.293.07.173.122.356.138.543l-.003.35a2 2 0 01-.947 1.556c-.35.211-.744.341-1.151.379l-.433.012-.364-.032a2.785 2.785 0 01-.502-.122 2.388 2.388 0 01-.475-.222l-.285-.209a1.957 1.957 0 01-.649-1.112 2.713 2.713 0 01-.033-.22l-.011-.334c.006-.09.02-.179.039-.268.05-.195.122-.384.213-.563.116-.226.25-.442.398-.648a11.703 11.703 0 011.371-1.517l.14-.126c.097-.065.098-.065.209-.097h.117zm-.717-46.518l.046-.003v39.006l-.098-.179a108.893 108.893 0 01-3.583-7.262 77.727 77.727 0 01-2.432-6.088 48 48 0 01-1.465-5.013c-.309-1.347-.545-2.714-.642-4.095a19.74 19.74 0 01-.034-1.771c.009-.514.03-1.027.063-1.54.051-.808.133-1.613.251-2.412a24.3 24.3 0 01.353-1.876c.114-.493.246-.981.397-1.462.217-.695.478-1.374.782-2.037.111-.239.23-.476.355-.709.753-1.395 1.775-2.68 3.113-3.539a6.503 6.503 0 012.894-1.02zm5.059.099l2.624.748a16.07 16.07 0 013.46 1.763 13.862 13.862 0 013.721 3.712 14.036 14.036 0 011.442 2.779 16.294 16.294 0 011.003 4.498c.035.403.054.808.062 1.212.01.375.007.752-.023 1.127a12.66 12.66 0 01-.471 2.479c-.193.662-.42 1.313-.68 1.951a28.33 28.33 0 01-1.08 2.333c-.875 1.689-1.882 3.305-2.959 4.868a75.697 75.697 0 01-4.267 5.568 105.724 105.724 0 01-5.118 5.673 108.898 108.898 0 003.369-6.893 85.84 85.84 0 001.638-3.947 62.622 62.622 0 001.526-4.439c.336-1.122.632-2.257.877-3.404.209-.983.374-1.977.476-2.977a19.66 19.66 0 00.096-2.509 35.718 35.718 0 00-.057-1.535c-.123-2.058-.435-4.109-1.035-6.082a17.87 17.87 0 00-.828-2.192c-.768-1.672-1.839-3.236-3.29-4.378l-.486-.355z"
					fill="#fff"
				/>
			</g>
			<defs>
				<radialGradient
					id="_Radial1"
					cx="0"
					cy="0"
					r="1"
					gradientUnits="userSpaceOnUse"
					gradientTransform="translate(50.51 48.332) scale(68.9126)"
				>
					<stop offset="0" stop-color="#ba7bf0" />
					<stop offset=".45" stop-color="#996bec" />
					<stop offset="1" stop-color="#5046e4" />
				</radialGradient>
				<radialGradient
					id="_Radial2"
					cx="0"
					cy="0"
					r="1"
					gradientUnits="userSpaceOnUse"
					gradientTransform="translate(50.504 48.327) scale(68.9056)"
				>
					<stop offset="0" stopColor="#ba7bf0" />
					<stop offset=".45" stopColor="#996bec" />
					<stop offset="1" stopColor="#5046e4" />
				</radialGradient>
			</defs>
		</svg>
	);
};

export { IconFly };
