"use client";

import { RotateCcw, SendHorizontal, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MiniCover } from "./landing-mockups";
import { Sparkle } from "./sparkle";

const prompt = "I want something similar to The Secret History, but lighter and with more mystery.";
const reply =
  "Ooh, a dark-academia itch with a softer edge. These two keep the clever friends and the secrets, but trade some of the dread for fun:";
const replyWords = reply.split(" ");

const picks = [
  {
    title: "Truly Devious",
    author: "Maureen Johnson",
    hue: 214,
    reason: "A cold case at an elite Vermont boarding school, told with wit instead of gloom.",
  },
  {
    title: "The Thursday Murder Club",
    author: "Richard Osman",
    hue: 340,
    reason: "Four sharp retirees, one murder, and a lot more laughter than dread.",
  },
] as const;

type ChatState = { typed: number; sent: boolean; thinking: boolean; words: number; cards: number; done: boolean };

const initialState: ChatState = { typed: 0, sent: false, thinking: false, words: 0, cards: 0, done: false };
const finalState: ChatState = { typed: 0, sent: true, thinking: false, words: replyWords.length, cards: picks.length, done: true };

/** A self-playing example conversation with Shelfie's AI reading assistant. */
export function ChatDemo() {
  const windowRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [run, setRun] = useState(0);
  const [state, setState] = useState<ChatState>(initialState);

  useEffect(() => {
    const element = windowRef.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setState(finalState);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setStarted(true);
        observer.disconnect();
      },
      { threshold: 0.45 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState(finalState);
      return;
    }

    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) => new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms)));
    const update = (patch: Partial<ChatState>) => {
      if (!cancelled) setState((current) => ({ ...current, ...patch }));
    };

    (async () => {
      setState(initialState);
      await wait(500);
      for (let index = 1; index <= prompt.length && !cancelled; index += 1) {
        update({ typed: index });
        await wait(prompt[index - 1] === " " ? 55 : 24 + ((index * 37) % 26));
      }
      await wait(380);
      update({ typed: 0, sent: true });
      await wait(420);
      update({ thinking: true });
      await wait(1500);
      update({ thinking: false });
      for (let index = 1; index <= replyWords.length && !cancelled; index += 1) {
        update({ words: index });
        await wait(48 + ((index * 13) % 40));
      }
      for (let index = 1; index <= picks.length && !cancelled; index += 1) {
        await wait(380);
        update({ cards: index });
      }
      await wait(400);
      update({ done: true });
    })();

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [started, run]);

  return (
    <div className="landing-chat-shell">
      <div
        ref={windowRef}
        className="landing-chat"
        role="img"
        aria-label={`Example conversation. A reader asks: "${prompt}" Shelfie's assistant suggests ${picks.map((pick) => `${pick.title} by ${pick.author}`).join(" and ")}.`}
      >
        <div className="landing-chat-head" aria-hidden="true">
          <span className="landing-chat-avatar"><Sparkles /></span>
          <span>
            <span className="landing-chat-name">Shelfie AI</span>
            <span className="landing-chat-status">{state.thinking ? "reading your shelf…" : "your reading assistant"}</span>
          </span>
        </div>

        <div className="landing-chat-body" aria-hidden="true">
          {!state.sent && (
            <div className="landing-chat-empty">
              <Sparkle className="landing-chat-empty-star" />
              <p>What are you in the mood for?</p>
              <span>A feeling, a season, a book you can&apos;t stop thinking about…</span>
            </div>
          )}
          {state.sent && <p className="landing-bubble landing-bubble-user">{prompt}</p>}

          {state.thinking && (
            <span className="landing-bubble landing-bubble-ai landing-thinking">
              <span /><span /><span />
            </span>
          )}

          {state.words > 0 && (
            <div className="landing-bubble landing-bubble-ai">
              <p>
                {replyWords.slice(0, state.words).map((word, index) => (
                  <span key={index} className="landing-stream-word">{word} </span>
                ))}
              </p>
              {state.cards > 0 && (
                <div className="landing-chat-cards">
                  {picks.slice(0, state.cards).map((pick) => (
                    <div key={pick.title} className="landing-chat-card">
                      <MiniCover hue={pick.hue} width="3rem" />
                      <span className="min-w-0">
                        <span className="mock-book-title">{pick.title}</span>
                        <span className="mock-book-author">{pick.author}</span>
                        <span className="mock-reason">{pick.reason}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="landing-chat-input" aria-hidden="true">
          <span className="landing-chat-typed">
            {state.typed > 0 ? prompt.slice(0, state.typed) : !state.sent ? <span className="landing-chat-placeholder">Tell Shelfie what you&apos;re in the mood for…</span> : null}
            {!state.sent && <span className="landing-caret" />}
          </span>
          <span className="landing-chat-send" data-ready={state.typed === prompt.length}><SendHorizontal /></span>
        </div>
      </div>

      <button
        type="button"
        className="landing-replay"
        data-visible={state.done}
        tabIndex={state.done ? 0 : -1}
        aria-hidden={!state.done}
        onClick={() => setRun((value) => value + 1)}
      >
        <RotateCcw aria-hidden="true" /> Play again
      </button>
    </div>
  );
}
