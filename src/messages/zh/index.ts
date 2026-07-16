import auth from './auth';
import editPart1 from './edit/part1';
import editPart2 from './edit/part2';
import home from './home';
import siteVersion from './siteVersion';
export default {
  ...siteVersion,
  Auth: auth,
  Home: home,
  Edit: { ...editPart1, ...editPart2 },
};
