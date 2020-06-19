const { Account } = require('../../lib/messages/account');
const userFixture = require('../fixtures/user.json');
const orgFixture = require('../fixtures/org.json');

describe('Account rendering', () => {
  test('works for users', async () => {
    const repositoryMessage = new Account({
      account: userFixture,
    });
    expect(repositoryMessage.getRenderedMessage()).toMatchSnapshot();
  });

  test('works for organizations', async () => {
    const repositoryMessage = new Account({
      account: orgFixture,
    });
    expect(repositoryMessage.getRenderedMessage()).toMatchSnapshot();
  });

  test('works for condensed users', async () => {
    const repositoryMessage = new Account({
      account: userFixture,
      unfurlType: 'condensed',
    });
    expect(repositoryMessage.getRenderedMessage()).toMatchSnapshot();
  });
});
