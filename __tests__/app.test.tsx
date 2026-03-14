/**
 * @format
 */

import { create } from "react-test-renderer";
import App from "../app.tsx";

test("renders correctly", () => {
  const tree = create(<App />);
  expect(tree).toBeDefined();
  expect(tree.toJSON()).not.toBeNull();
});
