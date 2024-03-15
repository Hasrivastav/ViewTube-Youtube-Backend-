import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// const toggleVideoLike = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   //TODO: toggle like on video

//   if (!isValidObjectId(videoId)) {
//     throw new ApiError(400, "Invalid videoid");
//   }

//   const alreadyLiked = await Like.findOne({
//     video: videoId,
//     likedBy: req.user?._id,
//   });

//   if (alreadyLiked) {
//     await Like.findByIdAndDelete(alreadyLiked?._id);

//     return res
//       .status(200)
//       .json(
//         new ApiResponse(201, { liked: false }, "Video Unliked Successfully")
//       );
//   } else {
//     await Like.create({
//       video: videoId,
//       likedBy: req.user?._id,
//     });

//     return res
//       .status(200)
//       .json(new ApiResponse(201, { liked: true }, "Video Liked Successfully"));
//   }
// });

 const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
     
    if(!(videoId&& isValidObjectId(videoId))) {
        throw new ApiError(403, "Invalid videoId")
    }

    const like = await Like.findOne({
    $and:[
   {likedBy:req.user?._id},
   {video:videoId},
  ]
})

var updateLike = undefined;
var addedlike = undefined;
if(like){
    updateLike = await Like.findByIdAndDelete(like?._id)
}else{
    addedlike = await Like.create({
           video:videoId,
           likedBy:req.user?._id, 
    })
}

return res 
   .status(200)
   .json(
    new ApiResponse(
        200 , 
        like? updateLike : addedlike,
        `Like has been successfully toggled from ${like ? "Liked to disliked":"Disliked to Liked"}`
    )
   )
 })


const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
const user = req.user?._id

if(!(commentId && isValidObjectId(commentId))){
    throw new ApiError(400 , "Invalid comment Id:error at toggleCommentLike")
}

const like = await Like.findOne({
    comment:commentId,
    likedBy:user,
   
})

var updatedLike = undefined ;
var addedLike = undefined ;
if(like){
  updatedLike = await Like.findOneAndDelete(
    {
     likedBy: user,
     comment: commentId,
    })
}else{
    addedLike = await Like.create({
        likedBy: user,
        comment: commentId,
    })
}

return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        like ? updatedLike : addedLike,
        `Like has been toggeled from ${
          like ? "liked to disliked" : "disliked to liked"
        }`
      )
    );

});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
 
    if (!isValidObjectId(tweetId)) {
       throw new ApiErrors(400, "Invalid TweetId");
    }
 
    const likeAlready = await Like.findOne({
       tweet: tweetId,
       likedBy: req.user?._id,
    });
 
    if (likeAlready) {
       await Like.findByIdAndDelete(likeAlready?._id);
 
       return res
          .status(200)
          .json(
             new ApiResponse(
                201,
                { tweeted: false },
                "Unlike Tweet Successfully"
             )
          );
    }
 
    await Like.create({
       tweet: tweetId,
       likedBy: req.uer?._id,
    });
 
    return res
       .status(200)
       .json(
          new ApiResponse(201, { tweeted: true }, "Tweet Liked Successfully")
       );
 });




const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user?._id;
  console.log(userId);

  if(!userId){
    throw new ApiError(400 ,"Invalid User Id")
  }

  // We can either use populate or aggregation pipeline
  // const likedVideos = await Like.find({ likedBy: req.user._id, video: { $exists: true } }).populate('video');
  const likedVideos = await Like.aggregate([
    {
        $match:{
          likedBy:new mongoose.Types.ObjectId(req.user?._id)
        }
    },
    {
        $lookup:{
            from:"videos",
            localField:"video",
            foreignField:"_id",
            as:"likedVideos",
            pipeline:[
                {
                 $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"ownerDetails",

                 },
            },
            {
                $unwind:"$ownerDetails"
            }
            ]
        }
    },
    {
        $unwind:"$likedVideos"
    } ,
    {
        $sort: {
           createdAt: -1,
        },
     },
    {
        $project: {
          likedVideos: {
               "videoFile.url": 1,
               "thumbnail.url": 1,
               owner: 1,
               title: 1,
               description: 1,
               views: 1,
               duration: 1,
               createdAt: 1,
               isPublished: 1,

               ownerDetails: {
                  username: 1,
                  fullName: 1,
                  "avatar?.url": 1,
               },
            },
         },
    }
    
  ])

  console.log(likedVideos)

  return res
  .status(200)
  .json(new ApiResponse(200 , likedVideos , "Videos fetched Successfully"))


});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
