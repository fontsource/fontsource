import Highlight, { defaultProps, Language } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/duotoneDark";

interface CodeProps {
  children: string;
  className: string | Language;
}

export const Code = ({ children, className }: CodeProps) => {
  const language = className.replace(/language-/, "");
  return (
    <Highlight
      {...defaultProps}
      code={children}
      theme={theme}
      language={language}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={className}
          style={{
            ...style,
            margin: "1em 0",
            padding: "20px 20px 0 20px",
            textAlign: "left",
            overflowX: "scroll",
          }}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};
