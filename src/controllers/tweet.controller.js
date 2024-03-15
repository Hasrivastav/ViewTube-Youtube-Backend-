import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is Required");
  }

  const tweet = await Tweet.create({
    content:content,
    owner: req?.user?._id,
  });
 console.log(tweet)
  if (!tweet) {
    throw new ApiError(500, "Error in creating tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, tweet, "Tweet created Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const {userId} =  req.params;

  if (!(userId && isValidObjectId(userId))) {
    throw new ApiError(400, "Invalid user id :error at getUserTweet");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              " avatar.url": 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "tweet",
        localField: "_id",
        as: "likedetails",

        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likeCount: {
          $size: "$likedetails",
        },
        ownerDetails: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likeCount: 1,
        createdAt: 1,
      },
    },
  ]);
  if (!tweets) {
    throw new ApiError(500, "Error in fetching tweets");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, tweets, "All Tweets fetched Successfully"));
});



const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  const { tweetId } = req.params;
  

  if (!(tweetId && isValidObjectId(tweetId))) {
    throw new ApiError(400, "Invalid tweetId:error at updateTweet");
  }

  if (!content.trim()) {
    throw new ApiError(400, "Invalid Contet Type");
  }

  const tweet = await Tweet.findById(tweetId);
  console.log(tweet)

  if (!tweet) {
    throw new ApiError(404, "No such tweet exist : error at updateTweet");
  }

  if (!tweet?.owner.equals(req.user?._id)) {
    throw new ApiError(
      400,
      "Not authorized to update the tweet :error at updateTweet"
    );
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: content,
      },
    },
    { new: true }
  );

  if (!updatedTweet) {
    throw new ApiError(500, "Failed to Update Tweet. Please Try again");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, updatedTweet, "Tweet updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet Id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }
  // console.log(tweet);

  if (tweet?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      400,
      "You can not delete the tweet as you are not the owner"
    );
  }

 const deletedTweet =  await Tweet.findByIdAndDelete(tweetId);
//  console.log(deletedTweet)
 if(!deletedTweet){
  throw new ApiError(400 , "Error while deleting tweet");
 }

 return res
    .status(200)
    .json(new ApiResponse(201, {}, " Tweet deleted Successfully"));


});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
