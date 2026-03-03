import FollowRequest from "../models/FollowRequest.js";

export const canUsersChat = async (userA, userB) => {
  const accepted = await FollowRequest.findOne({
    $or: [
      { requester: userA, recipient: userB, status: "accepted" },
      { requester: userB, recipient: userA, status: "accepted" }
    ]
  }).lean();

  return Boolean(accepted);
};
