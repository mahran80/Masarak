using Masarak.API.Policies;
using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Masarak.API.Controllers
{
    [ApiController]
    [Route("api/plans")]
    [Produces("application/json")]
    public class PlanController : ControllerBase
    {
        private readonly ISubscriptionService _subscriptionService;

        public PlanController(ISubscriptionService subscriptionService)
        {
            _subscriptionService = subscriptionService;
        }

        // GET /api/plans
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(IEnumerable<PlanDto>), 200)]
        public async Task<IActionResult> GetAllPlans()
        {
            var plans = await _subscriptionService.GetAllPlansAsync();
            return Ok(plans);
        }

        [HttpPost]
        [Authorize(Policy = AppPolicies.AdminOnly)]
        [ProducesResponseType(typeof(PlanDto), 200)]
        public async Task<IActionResult> CreatePlan([FromBody] CreatePlanRequest request)
        {
            var plan = await _subscriptionService.CreatePlanAsync(request);
            return Ok(plan);
        }

        [HttpPut("{planId}")]
        [Authorize(Policy = AppPolicies.AdminOnly)]
        [ProducesResponseType(typeof(PlanDto), 200)]
        public async Task<IActionResult> UpdatePlan(int planId, [FromBody] UpdatePlanRequest request)
        {
            try
            {
                var plan = await _subscriptionService.UpdatePlanAsync(planId, request);
                return Ok(plan);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("{planId}")]
        [Authorize(Policy = AppPolicies.AdminOnly)]
        [ProducesResponseType(204)]
        public async Task<IActionResult> DeletePlan(int planId)
        {
            try
            {
                await _subscriptionService.DeletePlanAsync(planId);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
