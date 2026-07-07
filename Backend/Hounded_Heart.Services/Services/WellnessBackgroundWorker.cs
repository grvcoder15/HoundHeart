using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

namespace Hounded_Heart.Services.Services
{
    public class WellnessBackgroundWorker : Microsoft.Extensions.Hosting.BackgroundService
    {
        // A simple concurrent queue to hold tasks
        private static readonly ConcurrentQueue<System.Func<Task>> _workItems = new();
        private static readonly SemaphoreSlim _signal = new(0);

        public static void QueueBackgroundWorkItem(System.Func<Task> workItem)
        {
            if (workItem == null) return;
            _workItems.Enqueue(workItem);
            _signal.Release();
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await _signal.WaitAsync(stoppingToken);

                if (_workItems.TryDequeue(out var workItem))
                {
                    try
                    {
                        await workItem();
                    }
                    catch (System.Exception ex)
                    {
                        System.Console.WriteLine($"[WellnessBackgroundWorker] Error executing background task: {ex.Message}");
                    }
                }
            }
        }
    }
}
