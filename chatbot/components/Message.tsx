"use client";
import { assets } from "../public/assets";
import moment from "moment";
import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import * as Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import { ReactNode, ComponentProps } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string | number | Date;
  isImage?: boolean;
}

interface MessageProps {
  message: ChatMessage;
}

const Message = ({ message }: MessageProps) => {
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Prism.highlightAll();
  }, [message.content]);

  // Copy full response
  const handleCopyResponse = () => {
    if (messageRef.current) {
      const text = messageRef.current.innerText || "";
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="px-2.5">
      {message.role === "user" ? (
        <div className="flex items-center justify-end my-4 gap-2">
          <div className="flex flex-col gap-2 p-2 px-4 bg-slate-50 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md max-w-2xl">
            <p className="text-sm dark:text-primary">{message.content}</p>
            <span className="text-[10px] text-gray-400 dark:text-[#B1A6C0]">
              {moment(message.timestamp).fromNow()}
            </span>
          </div>
          <div className="w-8 mr-2"></div>
        </div>
      ) : (
        <div className="inline-flex flex-col gap-2 p-2 px-4 max-w-2xl bg-primary/20 dark:bg-[#57317C]/30 border border-[#80609F]/30 rounded-md my-4 relative group">
          {/* Copy response button */}
          <button
            onClick={handleCopyResponse}
            className="absolute top-2 right-2 p-2 bg-gray-700 text-white rounded hover:bg-gray-600 z-10 opacity-0 group-hover:opacity-100 transition"
            title="Copy full response"
          >
            <img src="/copy.svg" alt="Copy" className="w-4 h-4" />
          </button>
          <div ref={messageRef}>
            {message.isImage ? (
              <img
                src={message.content}
                alt="content"
                className="w-full max-w-md mt-2 rounded-md"
              />
            ) : (
              <div className="text-sm dark:text-primary reset-tw">
                <Markdown
                  components={{
                    code(props) {
                      const { inline, className, children, ...rest } = props as ComponentProps<"code"> & { inline?: boolean; children: ReactNode };
                      if (!inline) {
                        const codeString = String(children).replace(/\n$/, "");
                        return (
                          <div className="relative group">
                            <pre className={`prism-dark-bg ${className || ""}`}>
                              <code className={className} {...rest}>{children}</code>
                            </pre>
                            <button
                              onClick={() => navigator.clipboard.writeText(codeString)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition bg-gray-700 text-white p-2 rounded hover:bg-gray-600"
                              title="Copy code"
                              type="button"
                            >
                              <img src="/copy.svg" alt="Copy" className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      }
                      return (
                        <code className={className} {...rest}>{children}</code>
                      );
                    }
                  }}
                >
                  {message.content}
                </Markdown>
              </div>
            )}
          </div>
          <span className="text-[10px] text-gray-400 dark:text-[#B1A6C0]">{moment(message.timestamp).fromNow()}</span>
        </div>
      )}
    </div>
  );
};

export default Message;