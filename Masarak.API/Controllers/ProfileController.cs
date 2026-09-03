using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Constants;
using Microsoft.AspNetCore.Http;

namespace Masarak.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role)!;

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var profile = await _profileService.GetProfileAsync(GetUserId(), GetUserRole());
            if (profile == null) return NotFound("User profile not found.");
            return Ok(profile);
        }

        [HttpGet("student/{studentId}")]
        [Authorize(Roles = AppRoles.Parent)]
        public async Task<IActionResult> GetStudentProfile(int studentId)
        {
            var profile = await _profileService.GetStudentProfileForParentAsync(GetUserId(), studentId);
            if (profile == null) return NotFound("Student not found or access denied.");
            return Ok(profile);
        }

        [HttpPut]
        [Authorize(Roles = $"{AppRoles.Teacher},{AppRoles.Parent},{AppRoles.Student}")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
        {
            var response = await _profileService.UpdateProfileAsync(GetUserId(), GetUserRole(), request);
            if (!response.Success) return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("avatar")]
        [Authorize(Roles = $"{AppRoles.Teacher},{AppRoles.Parent},{AppRoles.Student}")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("File is empty.");
            using var stream = file.OpenReadStream();
            var response = await _profileService.UploadAvatarAsync(GetUserId(), stream, file.FileName, file.Length);
            if (!response.Success) return BadRequest(response);
            return Ok(response);
        }

        [HttpDelete("avatar")]
        [Authorize(Roles = $"{AppRoles.Teacher},{AppRoles.Parent},{AppRoles.Student}")]
        public async Task<IActionResult> RemoveAvatar()
        {
            var response = await _profileService.RemoveAvatarAsync(GetUserId());
            if (!response.Success) return BadRequest(response);
            return Ok(response);
        }

        [HttpPut("student/{studentId}")]
        [Authorize(Roles = AppRoles.Parent)]
        public async Task<IActionResult> UpdateStudentProfile(int studentId, [FromBody] UpdateProfileDto request)
        {
            var response = await _profileService.UpdateStudentProfileForParentAsync(GetUserId(), studentId, request);
            if (!response.Success) return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("student/{studentId}/avatar")]
        [Authorize(Roles = AppRoles.Parent)]
        public async Task<IActionResult> UploadStudentAvatar(int studentId, IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("File is empty.");
            using var stream = file.OpenReadStream();
            var response = await _profileService.UploadStudentAvatarForParentAsync(GetUserId(), studentId, stream, file.FileName, file.Length);
            if (!response.Success) return BadRequest(response);
            return Ok(response);
        }

        [HttpDelete("student/{studentId}/avatar")]
        [Authorize(Roles = AppRoles.Parent)]
        public async Task<IActionResult> RemoveStudentAvatar(int studentId)
        {
            var response = await _profileService.RemoveStudentAvatarForParentAsync(GetUserId(), studentId);
            if (!response.Success) return BadRequest(response);
            return Ok(response);
        }
    }
}
