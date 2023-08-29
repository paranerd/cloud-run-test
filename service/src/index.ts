import { service } from './service';

const port = process.env.PORT || 8080;

service.listen(port, () => {
  console.log(`Behavioral Couponing Service listening at ${port}`);
});
