/**
 * @format
 */

import { act, create } from "react-test-renderer";
import App from "../app.tsx";

test("renders correctly", () => {
  let tree: ReturnType<typeof create> | undefined;
  act(() => {
    tree = create(<App />);
  });
  expect(tree).toBeDefined();
  expect(tree?.toJSON()).not.toBeNull();
  act(() => {
    tree?.unmount();
  });
});
