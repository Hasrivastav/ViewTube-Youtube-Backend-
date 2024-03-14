import mongoose, { Mongoose, isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      400,
      "Invalid Object videoId :error at getVideocommnets"
    );
  }
  const options = {
    page: parseInt(page, 1),
    limit: parseInt(limit, 10),
 };

  const commentsAggregated = await Comment.aggregatePaginate( 
    Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
   
      {
         $lookup: {
            from: "likes",
            foreignField: "comment",
            localField: "_id",
            as: "likes",
         },
      },
      {
        $addFields: {
           likesCount: {
              $sum: "$likes",
           },
           owner: {
              $first: "$owner",
           },
           isLiked: {
              $cond: {
                 if: {
                    $in: [req.user?._id, "$likes.likedBy"],
                 },
                 then: true,
                 else: false,
              },
           },
        },
     },
     {
      $project: {
         content: 1,
         createdAt: 1,
         likesCount: 1,
         owner: {
            username: 1,
            "avatar.url": 1,
         },
         isLiked: 1,
      },
   },
  ]) ,options);

  console.log(commentsAggregated)

 
//  const comments = await Comment.aggregatePaginate(
//   commentsAggregated,
//   options
// );

  if (!commentsAggregated) {
    throw new ApiError(
      "No comments found for the requested videio:error at getVideoComments"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, commentsAggregated, "Comments fetched Successflly"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const userId = req.user?._id;
  const { commentBody } = req.body;

  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      400,
      "Invalid Object videoId :error at getVideocommnets"
    );
  }

  if (!commentBody) {
    throw new ApiError(400, "Please add a valid comment :Eorror at AddComment");
  }

  if (!userId) {
    throw new ApiError(400, "Login to add a comment ");
  }

  const comment = await Comment.create({
    content: commentBody,
    video: videoId,
    owner: userId,
  });

  if (!comment) {
    throw new ApiError(400, "Eroor while adding comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added Successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const userId = req.user?._id;
  const {commentBody} = req.body;
  const oldComment = await Comment.findById(commentId);

  if (!oldComment.owner.equals(userId)) {
    throw new ApiError(
      400,
      "Unauthorized to update this comment:Error at update comment"
    );
  }
  if (!commentBody) {
    throw new ApiError(400, "Error while updating comment:Add a valid comment");
  }

  const newComment = await Comment.findByIdAndUpdate(commentId, {
    $set: {
      content: commentBody,
    },
  },
  { new: true }
  );

  
  if (!newComment) {
    throw new ApiError(500, "Failed to update the comment");
 }
  
  return res.status(200).json(
    new ApiResponse(200 , newComment , "comment Updated Succesfully")
  )
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const userId = req.user?._id;

  const comment = await Comment.findById(commentId);

  if (!comment.owner.equals(userId)) {
    throw new ApiError(
      400,
      "Unauthorized to delete this comment:Error at deleting comment"
    );
  }

  const deleteCommentResponse = await Comment.findByIdAndDelete(commentId)

  if(deleteCommentResponse){
   return res.status(200).json(
    new ApiResponse(200 , "Comment deleted successfully")
   )
  }else{
    throw new ApiError(400 , "Error while deleting comment")
  }
});

   


export { getVideoComments, addComment, updateComment, deleteComment };
