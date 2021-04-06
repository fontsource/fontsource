import { css, Global } from "@emotion/react";

// Algolia theme reset css
export const FontSearchStyles = () => (
  <Global
    styles={() => css`
      .ais-Breadcrumb-list,
      .ais-CurrentRefinements-list,
      .ais-HierarchicalMenu-list,
      .ais-Hits-list,
      .ais-Results-list,
      .ais-InfiniteHits-list,
      .ais-InfiniteResults-list,
      .ais-Menu-list,
      .ais-NumericMenu-list,
      .ais-Pagination-list,
      .ais-RatingMenu-list,
      .ais-RefinementList-list,
      .ais-ToggleRefinement-list {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .ais-ClearRefinements-button,
      .ais-CurrentRefinements-delete,
      .ais-CurrentRefinements-reset,
      .ais-GeoSearch-redo,
      .ais-GeoSearch-reset,
      .ais-HierarchicalMenu-showMore,
      .ais-InfiniteHits-loadPrevious,
      .ais-InfiniteHits-loadMore,
      .ais-InfiniteResults-loadMore,
      .ais-Menu-showMore,
      .ais-RangeInput-submit,
      .ais-RefinementList-showMore,
      .ais-SearchBox-submit,
      .ais-SearchBox-reset,
      .ais-VoiceSearch-button {
        padding: 0;
        overflow: visible;
        font: inherit;
        line-height: normal;
        color: inherit;
        background: none;
        border: 0;
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      .ais-ClearRefinements-button::-moz-focus-inner,
      .ais-CurrentRefinements-delete::-moz-focus-inner,
      .ais-CurrentRefinements-reset::-moz-focus-inner,
      .ais-GeoSearch-redo::-moz-focus-inner,
      .ais-GeoSearch-reset::-moz-focus-inner,
      .ais-HierarchicalMenu-showMore::-moz-focus-inner,
      .ais-InfiniteHits-loadPrevious::-moz-focus-inner,
      .ais-InfiniteHits-loadMore::-moz-focus-inner,
      .ais-InfiniteResults-loadMore::-moz-focus-inner,
      .ais-Menu-showMore::-moz-focus-inner,
      .ais-RangeInput-submit::-moz-focus-inner,
      .ais-RefinementList-showMore::-moz-focus-inner,
      .ais-SearchBox-submit::-moz-focus-inner,
      .ais-SearchBox-reset::-moz-focus-inner,
      .ais-VoiceSearch-button::-moz-focus-inner {
        padding: 0;
        border: 0;
      }
      .ais-ClearRefinements-button[disabled],
      .ais-CurrentRefinements-delete[disabled],
      .ais-CurrentRefinements-reset[disabled],
      .ais-GeoSearch-redo[disabled],
      .ais-GeoSearch-reset[disabled],
      .ais-HierarchicalMenu-showMore[disabled],
      .ais-InfiniteHits-loadPrevious[disabled],
      .ais-InfiniteHits-loadMore[disabled],
      .ais-InfiniteResults-loadMore[disabled],
      .ais-Menu-showMore[disabled],
      .ais-RangeInput-submit[disabled],
      .ais-RefinementList-showMore[disabled],
      .ais-SearchBox-submit[disabled],
      .ais-SearchBox-reset[disabled],
      .ais-VoiceSearch-button[disabled] {
        cursor: default;
      }

      .ais-Breadcrumb-list,
      .ais-Breadcrumb-item,
      .ais-Pagination-list,
      .ais-RangeInput-form,
      .ais-RatingMenu-link,
      .ais-PoweredBy {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .ais-GeoSearch,
      .ais-GeoSearch-map {
        height: 100%;
      }

      .ais-HierarchicalMenu-list .ais-HierarchicalMenu-list {
        margin-left: 1em;
      }

      .ais-PoweredBy-logo {
        display: block;
        height: 1.2em;
        width: auto;
      }

      .ais-RatingMenu-starIcon {
        display: block;
        width: 20px;
        height: 20px;
      }

      .ais-SearchBox-input::-ms-clear,
      .ais-SearchBox-input::-ms-reveal {
        display: none;
        width: 0;
        height: 0;
      }

      .ais-SearchBox-input::-webkit-search-decoration,
      .ais-SearchBox-input::-webkit-search-cancel-button,
      .ais-SearchBox-input::-webkit-search-results-button,
      .ais-SearchBox-input::-webkit-search-results-decoration {
        display: none;
      }

      .ais-RangeSlider .rheostat {
        overflow: visible;
        margin-top: 40px;
        margin-bottom: 40px;
      }

      .ais-RangeSlider .rheostat-background {
        height: 6px;
        top: 0px;
        width: 100%;
      }

      .ais-RangeSlider .rheostat-handle {
        margin-left: -12px;
        top: -7px;
      }

      .ais-RangeSlider .rheostat-background {
        position: relative;
        background-color: #ffffff;
        border: 1px solid #aaa;
      }

      .ais-RangeSlider .rheostat-progress {
        position: absolute;
        top: 1px;
        height: 4px;
        background-color: #333;
      }

      .rheostat-handle {
        position: relative;
        z-index: 1;
        width: 20px;
        height: 20px;
        background-color: #fff;
        border: 1px solid #333;
        border-radius: 50%;
        cursor: -webkit-grab;
        cursor: grab;
      }

      .rheostat-marker {
        margin-left: -1px;
        position: absolute;
        width: 1px;
        height: 5px;
        background-color: #aaa;
      }

      .rheostat-marker--large {
        height: 9px;
      }

      .rheostat-value {
        margin-left: 50%;
        padding-top: 15px;
        position: absolute;
        text-align: center;
        -webkit-transform: translateX(-50%);
        transform: translateX(-50%);
      }

      .rheostat-tooltip {
        margin-left: 50%;
        position: absolute;
        top: -22px;
        text-align: center;
        -webkit-transform: translateX(-50%);
        transform: translateX(-50%);
      }
    `}
  />
);
