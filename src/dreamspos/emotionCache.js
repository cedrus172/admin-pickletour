// Bộ nhớ đệm emotion của toàn ứng dụng.
// Mọi lớp do MUI/emotion sinh ra (.css-xxxx — gồm cả `sx`) được thêm tiền tố `html:not(#\9)` để
// luôn thắng các quy tắc theo lớp của Bootstrap/DreamsPOS (ví dụ `.table tbody tr td { … }`).
// Nhờ vậy thành phần mang lớp của theme vẫn nhận đúng phần tinh chỉnh `sx` mà từng trang đã viết.
import createCache from "@emotion/cache";
import { prefixer } from "stylis";

const BOOST = "html:not(#\\9) ";

function boostSpecificity(element) {
  if (element.type !== "rule" || !Array.isArray(element.props)) return;
  // chỉ đụng quy tắc có lớp emotion; kiểu toàn cục (html, body, *) và keyframes (0%, from…) giữ nguyên
  // eslint-disable-next-line no-param-reassign
  element.props = element.props.map((sel) =>
    sel.includes(".css-") && !sel.startsWith(BOOST) ? `${BOOST}${sel}` : sel
  );
}

const emotionCache = createCache({ key: "css", stylisPlugins: [prefixer, boostSpecificity] });

export default emotionCache;
