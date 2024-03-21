import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary ,deleteFromCloudinary} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  //we are using MongoDb atlas Full text-search functionlity 
  //Step =1 create a pipelineArray to contain he aggreagation logic for the pipeline
  //if there is a query than -
  //steps 2 - create a serach index (-search index is used to implement the text search based on the index the document can be accesd efficiently )
  // here we are using title and discription as indexes 
  //step - 3 if there is a userId present than the vedios are fetched in which  the owner mathces the userId
  //step 4- if there is sortBy prpety check if it is ascending or descinding

  const pipelineArray = [];
  if (query) {
    pipelineArray.push({
      $search: {
        index: "search-videos",
        text: {
          path: ["description", "title"],
          query: String(query),
        },
      },
    });
  }

  if(!(userId && isValidObjectId(userId))){
    throw new ApiError(400 , "Invalid User Id :error at getAllVideos")
  }

  pipelineArray.push({
    $match:{
      owner: new mongoose.Types.ObjectId(userId),
    }
   })
  //  console.log(userId)

   pipelineArray.push({ $match: { isPublished: true } });
  
   if ( sortBy && sortType) {
    pipelineArray.push(
      sortType === "asc"
        ? {
            $sort: {
              [sortBy]: 1,
            },
          }
        : {
            $sort: {
              [sortBy]: -1,
            },
          }
    );
  }


  const options = {
    page: Number(page,1),
    limit: Number(limit,10),
  };

  const videosAggregate = await Video.aggregatePaginate(
     Video.aggregate(pipelineArray),
    options
  ); 

  // console.log(videosAggregate)

  if (videosAggregate.length === 0) {
    throw new ApiError(
      404,
      "No videos were found in the pipeline or have been fethed from the database: Error at getAllVideos controller"
    );
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      videosAggregate,
      `Videos for page: ${page} and limit: ${limit} have been fetched successfully`
    )
  );

});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, discription } = req.body;
  const userId = req.user?._id;

  // if(!title && !discription){
  //     throw new ApiError(404,"No title or description")
  // }
  if ([title, discription].some((field) => field.trim() === "")) {
    throw new ApiError(404, "Please provide a valid title or discription");
  }
  console.log(req.user)

  const vedioLocalPath = await req.files?.videoFile[0].path;
  console.log(vedioLocalPath)
  const thumbailLocalPath = await  req.files?.thumbnail[0].path;

  if (!vedioLocalPath && !thumbailLocalPath) {
    throw new ApiError(404, "please provide Vedio and thumbnail");
  }

  const uploadedVideoFile = await uploadOnCloudinary(vedioLocalPath);
  const uploadedThumbnail = await uploadOnCloudinary(thumbailLocalPath);

  // console.log(uploadedVideoFile.url)
  // console.log(uploadedThumbnail.url)

  if (!uploadedVideoFile && !uploadedThumbnail) {
    throw new ApiError(
      404,
      "Error while uploading vedioFile and thubnail file on cloudinary"
    );
  }

  const vedio = await Video.create({
    title,
    discription,
    owner: userId,
    duration: uploadedVideoFile.duration,
    videoFile: {
      url: uploadedVideoFile?.url || "",
      publicId: uploadedVideoFile.public_id || "",
    },
    thumbnail: {
      url: uploadedThumbnail?.url || "",
      publicId: uploadedThumbnail.public_id || "",
    },
    isPublished: true,
  });

  return res
    .status(201)
    .json(new ApiResponse(200, vedio, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const ownerId = req?.user?._id;

  if (!(videoId && isValidObjectId(ownerId))) {
    throw new ApiError(
      404,
      "The provided id is not a valid ObjectId: Error at getVideoById controller"
    );
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
              pipeline: [
                {
                  $project: {
                    subscribers: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              subscribersCount: { $size: "$subscribers" },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [
                      new mongoose.Types.ObjectId(ownerId),
                      "$subscribers.subscriber",
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              userName: 1,
              fullName: 1,
              "avatar.url": 1,
              isSubscribed: true,
              subscribersCount: true,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as:"likes"
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        owner: { $first: "$owner" },
        isLiked: {
          $cond: {
            if: { $in: [req.user._id, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        "videoFile.url": 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video[0]) {
    throw new ApiError(404, "Video not found");
  }

  await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: {
        views: 1,
      },
    },
    { new: true }
  );

  await User.findByIdAndUpdate(req.user?._id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Vedio fetched Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);

  //TODO: update video details like title, description, thumbnail
  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      400,
      "NotValidObjectId: Provided videoId ${videoId} is not a valid object id: Error at updateVideo controller"
    );
  }

  if (!video?.owner.equals(req.user._id)) {
    throw new ApiError(
      400,
      "unauthorizedRequest: Only the owner of the video is allowed to update it: Error at updateVideo controller"
    );
  }

  const { title, discription } = req.body;
  if (!(title && discription)) {
    throw new ApiError(400, "Title and Description are required");
  }
  // const thumbnailToDelete = video.thumbnail.public_id
  const thumbnailToUpdate = req.file?.path;

  if (!thumbnailToUpdate) {
    throw new ApiError(
      400,
      "Error while fetching thumbnail localPath at updateVideo contoller"
    );
  }
  
  const thumbnail = await uploadOnCloudinary(thumbnailToUpdate);

  if (!thumbnail) {
    throw new ApiError(
      400,
      "Error while uploading thumbnail on the cloudinary"
    );
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        discription,
        thumbnail: {
          public_id: thumbnail.publicId,
          url: thumbnail.url,
        },
      },
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(400, "Failed to Updated : error at updateVideo");
  }

  if (updatedVideo) {
    await deleteFromCloudinary(video.thumbnail.publicId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if(!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(400 , "Invalid video ID")
  }

  const vedio = await Video.findById(videoId);
  console.log(vedio)
  if(!vedio) {
    throw new ApiError(404 ,"Vedio not found")
  }

  if(!vedio?.owner.equals(req.user._id )){
 throw new ApiError(400 , "Not authorized for the Deletion")
  }

  console.log(vedio?.videoFile.publicId)
  const deltedVideoFileResponse = await deleteFromCloudinary(vedio?.videoFile?.publicId);
  const deltedThumbnailResponse = await deleteFromCloudinary(vedio?.thumbnail?.publicId,"video");

  // console.log(deltedThumbnailResponse)

  // if(!(deltedVideoFileResponse==="ok" && deltedThumbnailResponse==="ok")){
  //   throw new ApiError(400 , "Vedio or Thumbnail could not be delted from the server:Error at delteVedio controller");
  // }

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  const deletedComments = await Comment.deleteMany({ video: videoId });
  const deletedLikes = await Like.deleteMany({
    $and: [{ video: videoId }, { tweet: { $exists: false } }],
  });
  if (deleteVideo && deletedComments && deletedLikes) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          `Video with id: ${deletedVideo._id} has been successfully deleted`
        )
      );
  } else {
    throw new ApiError(
      404,
      "Video could not be deleted: Error at deleteVideo controller"
    );
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  //Step 1: Check whther the owner meets the userId
  //Step 2: Fetch the video docuemnet
  //Step 3: Change the isPublished field to true
  const { videoId } = req.params;

  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      400,
      "InvalidObjectId: Proivede videoId is either emapty or not a valid objectId: Error at deleteVideo controller"
    );
  }

  const oldVideo = await Video.findById(videoId);

  console.log(oldVideo);
  console.log(req.user._id);

  if (!oldVideo?.owner.equals(req.user._id)) {
    throw new ApiError(
      400,
      "unauthorizedRequest: Only the owner of the video is allowed to update it: Error at updateVideo controller"
    );
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !oldVideo?.isPublished,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedVideo) {
    throw new ApiError(
      404,
      "Video has not fetched or isPublished field has not been updated"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        `isPublished filed has successfully been updated from ${
          !updatedVideo.isPublished
        } to ${updatedVideo.isPublished}`
      )
    );
});




export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
