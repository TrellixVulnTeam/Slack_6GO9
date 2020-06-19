const { SlackWorkspace, SlackUser, GitHubUser } = require('../models');

/**
 * Make slackUser and slackWorkspace available
 */
module.exports = async function attachMetaData(req, res, next) {
  const userId = req.body.user.id;
  const teamId = req.body.team.id;

  const slackWorkspace = await SlackWorkspace.findOne({ where: { slackId: teamId } });
  const [slackUser] = await SlackUser.findOrCreate({
    where: { slackId: userId, slackWorkspaceId: slackWorkspace.id },
    include: [GitHubUser],
  });


  // Store metadata in res.locals so it can be used later in the request
  Object.assign(res.locals, {
    slackUser,
    slackWorkspace,
  });

  next();
};
