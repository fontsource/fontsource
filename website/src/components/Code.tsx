import { Box, Code as InlineCode } from "@chakra-ui/react";
import Highlight, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/duotoneDark";

export const Code = (props) => {
  const { children, className } = props;

  const language = className ? className.replace(/language-/, "") : "";
  if (language == "") return <InlineCode {...props} />;

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
            <Box key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </Box>
          ))}
        </pre>
      )}
    </Highlight>
  );
};
