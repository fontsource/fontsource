import React, { useLayoutEffect } from "react";

// Pass this the ref of an element which you expect to maintain scroll
// position across navigation. It uses localStorage (if possible), to
// write the current scrollTop when we detect navigation to a new URL.
// The next page which mounts this component will try to read the last
// persisted scrollTop, and scroll to that position.
//
// Note: We're avoiding the unload/beforeunload events here because
// they're not as reliable as visibilitychange/pagehide, which also
// account for things like cached navigation on Safari. Source:
// https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon#sending_analytics_at_the_end_of_a_session

const LOCAL_STORAGE_ITEM_NAME = "sidebar-scroll-top";

export const usePersistedScrollTop = (ref: React.RefObject<HTMLElement>) =>
  useLayoutEffect(() => {
    let scrollTop = 0;

    try {
      scrollTop = +localStorage.getItem(LOCAL_STORAGE_ITEM_NAME);
    } catch (err) {
      console.log(err);
    }

    if (scrollTop !== 0) {
      ref.current.scrollTop = scrollTop;
    }

    const listener = (event: Event) => {
      if (event.type === "pagehide" || document.visibilityState === "hidden") {
        stopListening();

        try {
          localStorage.setItem(
            LOCAL_STORAGE_ITEM_NAME,
            String(ref.current.scrollTop)
          );
        } catch (err) {
          console.error(err);
        }
      }
    };

    const stopListening = () => {
      document.removeEventListener("visibilitychange", listener);
      document.removeEventListener("pagehide", listener);
    };

    document.addEventListener("visibilitychange", listener);
    document.addEventListener("pagehide", listener);

    return () => {
      stopListening();
    };
  }, [ref]);
