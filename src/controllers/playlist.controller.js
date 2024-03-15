import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import {Video} from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  if (!(name || description)) {
    throw new ApiError(400, "all fields are required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(500, "Failed to create a playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, ` ${name} Playlist created Successfully`));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!(userId && isValidObjectId(userId))) {
    throw new ApiError(
      `InvalidObjecId: ${userId} is not a valid ownerId: Error at getUserPlaylists controller`
    );
  }

  const playlists = await Playlist.find({
    owner: userId,
  });
// console.log(playlists)
  if (playlists.length === 0) {
    throw new ApiError(
      404,
      `noValuesFound: No playlist has been found for the user with the id: ${userId}: Error st getUserPlaylists controller`
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlists,
        `Playlists created by the user with the id: ${userId} have been fetched successfully`
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
const { playlistId } = req.params;


  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "videos",
        as: "videos",
      },
    },
  
    {
      $match: {
        "videos.isPublished": true,
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "owner",
      },
    },
    {
      $addFields: {
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$owner",
        },
        totalVideos: {
          $size: "$videos",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        totalViews: 1,
        owner: {
          username: 1,
          fullName: 1,
          "avatar.url": 1,
        },
        videos: {
          _id: 1,
          createdAt: 1,
          description: 1,
          views: 1,
          title: 1,
          "videoFile.url": 1,
          "thumbnail.url": 1,
          duration: 1,
        },
      },
    },
  ]);
  console.log(playlist)

  if (!playlist) {
    throw new ApiError(500, "Failed to fetch playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, playlist, "Playlist fetched Successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const playlist = await Playlist.findById(playlistId);

  if (!(playlistId && isValidObjectId(playlistId))) {
    throw new ApiError(
      `InvalidObjecId: ${playlistId} is not a valid playlistId: Error at addVideoToPlaylist controller`
    );
  }

  if (!(videoId && isValidObjectId(videoId))) {
    throw new ApiError(
      `InvalidObjecId: ${videoId} is not a valid videoId: Error at addVideoToPlaylist controller`
    );
  }

  if (!playlist?.owner.equals(req.user._id)) {
    throw new ApiError(400, "Only owner of the playlist can add the video");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "Failed to update the playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        updatedPlaylist,
        "Video has been added to playlist Successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  const video = await Video.findById(videoId);
  const playlist = await Playlist.findById(playlistId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  if (!playlist) {
    throw new ApiError(400, "PlaylistId not found");
  }

  if (!(isValidObjectId(playlistId) || isValidObjectId(videoId))) {
    throw new ApiError(400, "Check PlaylistId and VideoId Once again");
  }

  if (!playlist?.owner.equals(req.user._id)) {
    throw new ApiError(400, "Only owner of the playlist can add the video");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiErrors(400, "Failed to update the playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        updatedPlaylist,
        "Video has been deleted from playlist Successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "PlaylistId not found");
  }

  if (!playlist?.owner.equals(req.user._id)) {
    throw new ApiError(
      400,
      "Not authorized for deleting this PlayList :Error at deletePlaylist"
    );
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Playlist deleted Successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "PlaylistId not found");
  }

  if (!playlist?.owner.equals(req.user._id)) {
    throw new ApiError(
      400,
      "Not authorized for deleting this PlayList :Error at deletePlaylist"
    );
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "Failed to update the Playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        updatedPlaylist,
        "Playlist has been Updated Successfully"
      )
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
