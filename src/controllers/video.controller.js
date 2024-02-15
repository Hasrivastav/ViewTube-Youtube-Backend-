import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
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

  const vedioLocalPath = req.files?.videoFile[0].path;
  const thumbailLocalPath = req.files?.thumbnail[0].path;

  if (!vedioLocalPath && !thumbailLocalPath) {
    throw new ApiError(404, "please provide Vedio and thumbnail");
  }

  const uploadedVideoFile = await uploadOnCloudinary(vedioLocalPath);
  const uploadedThumbnail = await uploadOnCloudinary(thumbailLocalPath);

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
        $lookup:{
            from:"likes",
            let :{videioId:"$_id"},
            as:"likes",
            pipeline:[
                {
                    $match:{
                       $expr:{
                        $and:[
                            {$eq:["video" , "$$videoid"]},
                            {
                                $or:[
                                    {$eq:[{$type:"$comment"},"missing"]},
                                    { $eq: ["$comment", null] },
                                ]
                            }
                        ]
                       }  
                    }
                }
            ]

        }
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
    video?._id,
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
  //TODO: update video details like title, description, thumbnail
  if(!(videoId && isValidObjectId(videoId))){
    throw new ApiError(400 , "NotValidObjectId: Provided videoId ${videoId} is not a valid object id: Error at updateVideo controller")
  }

const oldVideo = await Video.findById(videoId);
if(!oldVideo?.owner.equals(req.user._id)) {
    throw new ApiError(
        400,
        "unauthorizedRequest: Only the owner of the video is allowed to update it: Error at updateVideo controller"
      );
}

   const {title , discription}= req.body;
   const thumbailLocalPath = req.files.thumbnail[0].path;


if(!thumbailLocalPath){
    throw new ApiError(400 , "Error while fetching thumbnail localPath at updateVideo contoller")
}

const uploadThumbnail = await uploadOnCloudinary(thumbailLocalPath)

if(!uploadThumbnail){
    throw new ApiError(400 , "Error while uploading thumbnail on the cloudinary")
}

if(title)

})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
