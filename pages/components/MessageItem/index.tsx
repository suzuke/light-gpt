import React, { useEffect, useRef } from 'react';

import Image from 'next/image';

import { toast } from 'react-toastify';

import MarkdownIt from 'markdown-it';

import MdHighlight from 'markdown-it-highlightjs';

// @ts-ignore
import MdKatex from 'markdown-it-katex';

import Highlightjs from 'highlight.js';

// styles
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';

import { ERole } from '../../../interface';

import styles from './index.module.scss';

export const testMd = `
# My Markdown Document

Here is some code:

\`\`\`js
const greet = (name) => {
  console.log(\`Hello, \${name}!\`);
};

greet('World');
\`\`\`

Here is a math formula:

$$
\\sum_{i=1}^n i^2 = \\frac{n(n+1)(2n+1)}{6}
$$
`;

const MessageItem: React.FC<{
    id: string;
    role: ERole;
    message: string;
    avatar?: string;
    showRetry?: boolean;
    onRetry?: () => void;
    removeMessageById?: (id: string) => void;
}> = ({ id, role, message, avatar, showRetry, onRetry, removeMessageById }) => {
    const currentMessageEle = useRef<HTMLDivElement | null>(null);

    const htmlString = () => {
        const md = MarkdownIt()
            .use(MdHighlight, {
                hljs: Highlightjs,
            })
            .use(MdKatex);
        const fence = md.renderer.rules.fence;
        if (!fence) return '';
        md.renderer.rules.fence = (...args) => {
            const [tokens, idx] = args;
            const token = tokens[idx];
            const rawCode = fence(...args);
            return `<div class='highlight-js-pre-container'>
        <div id class="copy" data-code=${encodeURIComponent(token.content)}>
        <i class="fa fa-clipboard" aria-hidden="true"></i> 
        </div>
        ${rawCode}
        </div>`;
        };
        // return md.render(testMd);
        return md.render(message || '');
    };

    useEffect(() => {
        if (!currentMessageEle.current) return;
        const faClipboardIList =
            currentMessageEle.current.querySelectorAll('.copy');
        if (faClipboardIList.length === 0) return;
        const clickHandler = (e: Event) => {
            e.stopPropagation();
            const el = e.currentTarget as HTMLElement;
            let code = '';

            // console.log('点击复制', el);
            code = decodeURIComponent(el.dataset.code || '');
            // 创建一个新的ClipboardItem对象
            navigator.clipboard
                .writeText(code)
                .then(() => {
                    toast.success('code copied', { autoClose: 1000 });
                })
                .catch((err) => {
                    // console.error('写入剪贴板失败：', err)
                });
        };
        faClipboardIList.forEach((item) => {
            if (!item) return;
            item.addEventListener('click', clickHandler);
        });
        return () => {
            faClipboardIList.forEach((item) => {
                if (!item) return;
                item.removeEventListener('click', clickHandler);
            });
        };
    }, []);

    return (
        <div
            className={styles.message}
            ref={(ele) => (currentMessageEle.current = ele)}
        >
            <i
                className={`fas fa-trash-alt ${styles.removeMessage}`}
                onClick={() => {
                    removeMessageById?.(id);
                }}
            ></i>
            {role === ERole.user ? (
                <>
                    <div className={styles.placeholder}></div>
                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{
                            __html: htmlString(),
                        }}
                    ></div>
                    <div className={`${styles.user} ${styles.avatar}`}>
                        {avatar && (
                            <Image
                                className={styles.img}
                                width={40}
                                height={40}
                                src={avatar}
                                alt="user"
                            />
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className={`${styles.assistant} ${styles.avatar}`}>
                        {avatar && (
                            <Image
                                className={styles.img}
                                width={40}
                                height={40}
                                src={avatar}
                                alt="robot"
                            />
                        )}
                    </div>
                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{
                            __html: htmlString(),
                        }}
                    ></div>
                    <div className={styles.placeholder}></div>
                </>
            )}
            {showRetry && onRetry && (
                <div className={styles.regenerateBtn} onClick={onRetry}>
                    Regenerate
                </div>
            )}
        </div>
    );
};

export default React.memo(MessageItem);
