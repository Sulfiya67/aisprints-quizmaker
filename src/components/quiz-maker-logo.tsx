type QuizMakerLogoProps = {
	className?: string;
};

export function QuizMakerLogo({ className }: QuizMakerLogoProps) {
	return (
		<div
			className={className}
			aria-hidden
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				className="size-5"
				xmlns="http://www.w3.org/2000/svg"
			>
				<rect
					x="4"
					y="3"
					width="16"
					height="18"
					rx="2.5"
					fill="currentColor"
					fillOpacity="0.15"
					stroke="currentColor"
					strokeWidth="1.5"
				/>
				<path
					d="M8 3V5.5C8 6.33 8.67 7 9.5 7H14.5C15.33 7 16 6.33 16 5.5V3"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
				<path
					d="M8.5 10.5H15.5M8.5 14H12"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
				<path
					d="M14.5 16.5L16 18L19 15"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</div>
	);
}
